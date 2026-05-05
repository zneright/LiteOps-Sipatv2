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
        
        // If JSON is empty, don't just fail—send the CORS headers manually 
        // just in case the filter didn't catch it yet.
        if (!$json) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => 'No JSON data provided']);
        }

        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            
            $data = [
                'firebase_uid'      => $json->firebase_uid ?? '',
                'email'             => $json->email ?? '',
                'full_name'         => $json->full_name ?? 'Anonymous',
                'role'              => $json->role ?? 'citizen',
                'organization_name' => $json->organization_name ?? null,
                'is_approved'       => $json->is_approved ?? 0,
                'created_at'        => date('Y-m-d H:i:s')
            ];

            if ($builder->insert($data)) {
                return $this->respondCreated(['status' => 201, 'message' => 'User saved']);
            }
        } catch (\Exception $e) {
            // This is the most important part: send the error as JSON
            // so the browser doesn't interpret it as a CORS failure.
            return $this->response
                ->setStatusCode(500)
                ->setJSON(['error' => $e->getMessage()]);
        }
    }
    public function index()
    {
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