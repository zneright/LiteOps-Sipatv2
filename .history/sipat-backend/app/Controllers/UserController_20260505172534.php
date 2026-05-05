<?php
namespace App\Controllers\Api;
use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    public function create()
    {
        // Handle CORS Preflight
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        if ($this->request->getMethod() === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        // Save to Database logic using CodeIgniter Query Builder
        $db = \Config\Database::connect();
        $builder = $db->table('users');
        
        $data = [
            'firebase_uid'      => $json->firebase_uid,
            'email'             => $json->email,
            'full_name'         => $json->full_name,
            'role'              => $json->role,
            'organization_name' => $json->organization_name,
            'is_approved'       => $json->is_approved,
            'created_at'        => date('Y-m-d H:i:s')
        ];

        if ($builder->insert($data)) {
            return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
        }

        return $this->failServerError('Failed to save user.');
    }
}