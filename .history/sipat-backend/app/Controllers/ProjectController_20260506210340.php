<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class ProjectController extends BaseController
{
    use ResponseTrait;

   public function create()
    {
        // Handle CORS Security
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        
        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No payload', 400);

        // 🚀 HELPER: Safely parse dates. 
        // If AI hallucinates text like "TBD" or "Unknown", it forces it to null to prevent MySQL crashes.
        $parseDate = function($dateStr) {
            if (empty($dateStr)) return null;
            $timestamp = strtotime($dateStr);
            return $timestamp ? date('Y-m-d', $timestamp) : null;
        };

        try {
            $db = \Config\Database::connect();
            $builder = $db->table('projects');
            
            // 🚀 FIX: Added `?? null` to ALL fields to prevent PHP 8 "Undefined Property" fatal errors
            $data = [
                'title'           => $json->title ?? 'Untitled Project',
                'category'        => $json->category ?? 'General',
                'budget'          => $json->budget ?? '0',
                'description'     => $json->description ?? '',
                'keywords'        => $json->keywords ?? null,
                'start_date'      => $parseDate($json->start_date ?? null), 
                'completion_date' => $parseDate($json->completion_date ?? null), 
                'phases'          => $json->phases ?? null,
                'ai_summary'      => $json->ai_summary ?? null, 
                'file_url'        => $json->file_url ?? null, 
                'file_type'       => $json->file_type ?? null,
                'created_at'      => date('Y-m-d H:i:s')
            ];

            if ($builder->insert($data)) {
                return $this->respondCreated(['status' => 201, 'message' => 'Project Published']);
            }
            return $this->failServerError('Failed to save project.');

        } catch (\Exception $e) {
            // Sends the exact MySQL error back to your React frontend
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
    // Fetch a single project for the ProjectView page
    public function show($id = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT');

        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        try {
            $db = \Config\Database::connect();
            
            // Fetch the single project where ID matches the URL parameter
            $project = $db->table('projects')->where('id', $id)->get()->getRowArray();

            if (!$project) {
                return $this->failNotFound('Project not found.');
            }

            return $this->respond($project);

        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
    public function index()
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT');

        try {
            $db = \Config\Database::connect();
            $projects = $db->table('projects')->orderBy('created_at', 'DESC')->get()->getResultArray();
            return $this->respond($projects);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    // 2. UPDATE A PROJECT (For updating phases/proof)
    public function update($id = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT');

        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No payload', 400);

        try {
            $db = \Config\Database::connect();
            $builder = $db->table('projects');
            $builder->where('id', $id);
            
            // We only need to update the phases column when they upload proof!
            if ($builder->update(['phases' => $json->phases])) {
                return $this->respond(['status' => 200, 'message' => 'Project Updated']);
            }
            return $this->failServerError('Failed to update project.');

        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
    // 🚀 NEW: Handles Likes/Unlikes for the Overall Project
    public function react($projectId = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT');

        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON(); // { type: 'likes' | 'unlikes' | 'neutrals' }
        
        try {
            $db = \Config\Database::connect();
            // Securely increments the column
            $db->query("UPDATE projects SET {$json->type} = {$json->type} + 1 WHERE id = ?", [$projectId]);
            return $this->respond(['status' => 200, 'message' => 'Reacted to project']);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    // 🚀 NEW: Handles 1-per-person Likes/Unlikes for the Overall Project
    public function react($projectId = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT');

        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON(); // { type: 'likes' | 'unlikes' | 'neutrals', user_email: '...' }
        $email = $json->user_email ?? null;

        if (!$email) return $this->failUnauthorized('Must provide email');

        try {
            $db = \Config\Database::connect();
            
            // Check if user already reacted
            $existing = $db->table('project_reactions')
                           ->where('project_id', $projectId)
                           ->where('user_email', $email)
                           ->get()->getRowArray();

            if ($existing) {
                if ($existing['reaction_type'] === $json->type) {
                    return $this->respond(['status' => 200, 'message' => 'Already reacted with this type']);
                } else {
                    // Switch reaction: subtract old, add new
                    $db->query("UPDATE projects SET {$existing['reaction_type']} = GREATEST({$existing['reaction_type']} - 1, 0) WHERE id = ?", [$projectId]);
                    $db->query("UPDATE projects SET {$json->type} = {$json->type} + 1 WHERE id = ?", [$projectId]);
                    $db->table('project_reactions')->where('id', $existing['id'])->update(['reaction_type' => $json->type]);
                    return $this->respond(['status' => 200, 'message' => 'Reaction switched']);
                }
            }

            // New reaction
            $db->query("UPDATE projects SET {$json->type} = {$json->type} + 1 WHERE id = ?", [$projectId]);
            $db->table('project_reactions')->insert([
                'project_id' => $projectId,
                'user_email' => $email,
                'reaction_type' => $json->type
            ]);

            return $this->respond(['status' => 200, 'message' => 'Reacted to project']);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
}