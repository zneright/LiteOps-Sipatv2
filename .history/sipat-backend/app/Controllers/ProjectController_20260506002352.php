<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class ProjectController extends BaseController
{
    use ResponseTrait;

    public function create()
    {
        // Handle CORS
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
            $builder = $db->table('projects');
            
            $data = [
                'title'       => $json->title,
                'category'    => $json->category,
                'budget'      => $json->budget,
                'description' => $json->description,
                'file_url'    => $json->file_url, // Cloudinary URL
                'file_type'   => $json->file_type,
                'ai_summary'  => $json->ai_summary, // 🚀 NEW: The raw data Khoj will read later!
                'created_at'  => date('Y-m-d H:i:s')
            ];

            if ($builder->insert($data)) {
                return $this->respondCreated(['status' => 201, 'message' => 'Project Published']);
            }
            return $this->failServerError('Failed to save project.');

        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
}