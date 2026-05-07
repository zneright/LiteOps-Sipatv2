<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class ProjectController extends BaseController
{
    use ResponseTrait;

   public function create()
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        
        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No payload', 400);

        $parseDate = function($dateStr) {
            if (empty($dateStr)) return null;
            $timestamp = strtotime($dateStr);
            return $timestamp ? date('Y-m-d', $timestamp) : null;
        };

        try {
            $db = \Config\Database::connect();
            $builder = $db->table('projects');
            
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
                if ($db->table('users')->insert($data)) {
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => 'PROJECT CREATION',
                    'description' => "Created a new project.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'Project created']);
            }
            return $this->failServerError('Failed to save user.');
            }
            return $this->failServerError('Failed to save project.');

        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
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
            
            $project = $db->table('projects')->where('id', $id)->get()->getRowArray();

            if (!$project) {
                return $this->failNotFound('Project not found.');
            }

            return $this->respond($project);
        if ($db->table('users')->insert($data)) {
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => '',
                    'description' => "Registered a new {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
            return $this->failServerError('Failed to save user.');
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

    // 🚀 BULLETPROOF SEARCH ENDPOINT
    public function search()
    {
        // 1. MUST HAVE CORS HEADERS
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, OPTIONS');

        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $query = $this->request->getVar('q');
        
        if (!$query) {
            return $this->respond(['projects' => [], 'users' => []]);
        }

        try {
            $db = \Config\Database::connect();
            
            // 1. Search Projects (Safely searching ONLY guaranteed columns)
            $projects = $db->table('projects')
                ->groupStart()
                    ->like('title', $query, 'both', null, true)
                    ->orLike('description', $query, 'both', null, true)
                    ->orLike('category', $query, 'both', null, true)
                ->groupEnd()
                ->orderBy('created_at', 'DESC')
                ->get()->getResultArray();

            // 2. Search Comments (Find projects based on citizen feedback!)
            $comments = $db->table('comments')
                ->groupStart()
                    ->like('text_content', $query, 'both', null, true)
                    ->orLike('author_name', $query, 'both', null, true)
                ->groupEnd()
                ->get()->getResultArray();

            $commentProjectIds = array_column($comments, 'project_id');
            
            // If we found matching comments, pull those projects too
            if (!empty($commentProjectIds)) {
                $commentProjects = $db->table('projects')
                    ->whereIn('id', $commentProjectIds)
                    ->get()->getResultArray();
                    
                // Merge them without duplicates
                $existingIds = array_column($projects, 'id');
                foreach ($commentProjects as $cp) {
                    if (!in_array($cp['id'], $existingIds)) {
                        $cp['found_via_comment'] = true; 
                        $projects[] = $cp;
                        $existingIds[] = $cp['id'];
                    }
                }
            }

            // 3. Search ALL Users (Agencies AND Citizens)
            $users = $db->table('users')
                ->groupStart()
                    ->like('organization_name', $query, 'both', null, true)
                    ->orLike('full_name', $query, 'both', null, true)
                    ->orLike('bio', $query, 'both', null, true)
                ->groupEnd()
                ->get()->getResultArray();

            return $this->respond([
                'projects' => $projects,
                'users' => $users
            ]);

        } catch (\Exception $e) {
            // 🚀 IF IT CRASHES, IT WILL NOW TELL YOU EXACTLY WHY!
            return $this->failServerError('Search Crash: ' . $e->getMessage());
        }
    }
}