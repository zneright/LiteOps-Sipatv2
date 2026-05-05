<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    // --- YOUR EXISTING CREATE FUNCTION STAYS HERE ---
    public function create()
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        
        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

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

    // --- NEW INDEX FUNCTION FOR GET REQUESTS ---
    public function index()
    {
        // Simple CORS header so React can fetch this list later
        header('Access-Control-Allow-Origin: *');

        // Fetch all users from the database, newest first
        $db = \Config\Database::connect();
        $builder = $db->table('users');
        $users = $builder->orderBy('created_at', 'DESC')->get()->getResultArray();

        // Return the data as beautiful JSON
        return $this->respond($users);
    }
}