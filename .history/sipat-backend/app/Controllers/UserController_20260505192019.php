<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    public function create()
    {
        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            
            $data = [
                'firebase_uid'      => $json->firebase_uid,
                'email'             => $json->email,
                'full_name'         => $json->full_name,
                'role'              => $json->role,
                // Use the null coalescing operator to prevent "property does not exist" errors
                'organization_name' => $json->organization_name ?? null, 
                'is_approved'       => $json->is_approved ?? 0,
                'created_at'        => date('Y-m-d H:i:s')
            ];

            if ($builder->insert($data)) {
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }

            return $this->failServerError('Failed to save user.');

        } catch (\Exception $e) {
            // Log the error locally so you can see it in /writable/logs
            log_message('error', '[DB ERROR] ' . $e->getMessage());
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    public function index()
    {
        header('Access-Control-Allow-Origin: *');
        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            $users = $builder->orderBy('created_at', 'DESC')->get()->getResultArray();
            return $this->respond($users);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    // --- NEW: FETCH SINGLE USER TO GET THEIR ROLE ---
    public function show($email = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();

        if ($user) {
            return $this->respond($user);
        }

        // Even if not found, the filter ensures the browser doesn't throw a CORS error
        return $this->failNotFound('User not found in database');
    }
}