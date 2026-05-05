<?php
namespace App\Controllers; // Fixed: Removed the \Api since the file is just in Controllers/

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    public function create()
    {
        // 1. Hardcore CORS Headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        
        // 2. Intercept the OPTIONS preflight request and approve it immediately
        if ($this->request->getMethod(true) === 'OPTIONS') { // Added 'true' to get the real HTTP method
            return $this->response->setStatusCode(200);
        }

        // 3. Process the actual payload
        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        // Save to Database logic
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