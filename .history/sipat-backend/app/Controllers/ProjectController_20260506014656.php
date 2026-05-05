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

        try {
            $db = \Config\Database::connect();
            
            // Connect to your 'projects' table
            $builder = $db->table('projects');
            
            $data = [
                'title'       => $json->title,
                'category'    => $json->category,
                'budget'      => $json->budget,
                'keywords'    => $json->keywords,   // New
    'start_date'  => $json->start_date, // New
    'end_date'    => $json->end_date,   // New
                'description' => $json->description,
                'phases'      => $json->phases, // 🚀 Saves your AI Phase array!
                'ai_summary'  => $json->ai_summary, // 🚀 Saves the data for Khoj!
                'file_url'    => $json->file_url, // The Cloudinary URL
                'file_type'   => $json->file_type,
                'created_at'  => date('Y-m-d H:i:s')
                
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
}