<?php
namespace App\Controllers;
use CodeIgniter\RESTful\ResourceController;

class CommentController extends ResourceController
{
    public function __construct() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: *');
        header('Access-Control-Allow-Methods: *');
    }

    public function index($projectId = null) {
        $db = \Config\Database::connect();
        $comments = $db->table('comments')
                       ->where('project_id', $projectId)
                       ->orderBy('ai_match_score', 'DESC')
                       ->orderBy('created_at', 'DESC')
                       ->get()->getResultArray();
        return $this->respond($comments);
    }

    public function create() {
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);
        $json = $this->request->getJSON();

        $db = \Config\Database::connect();

        $data = [
            'project_id'     => $json->project_id,
            'parent_id'      => $json->parent_id ?? null,
            'user_email'     => $json->user_email ?? null,
            'target_phase'   => $json->target_phase ?? 'Overall Project',
            'author_name'    => $json->is_anonymous ? 'Anonymous Citizen' : ($json->author_name ?? 'Citizen'),
            'text_content'   => $json->text_content,
            'image_url'      => $json->image_url ?? null,
            'ai_match_score' => $json->ai_match_score ?? 0,
            'is_ghost_alert' => $json->is_ghost_alert ?? false,
            'created_at'     => date('Y-m-d H:i:s')
        ];
        $db->table('comments')->insert($data);

        if (!empty($json->user_email)) {
            $user = $db->table('users')->where('email', $json->user_email)->get()->getRowArray();
            $realName = $user ? ($user['full_name'] ?: $user['organization_name']) : 'Unknown';
            $role = $user ? $user['role'] : 'citizen';

            $actionDesc = "Posted public evidence on Project #" . $json->project_id;
            if ($json->is_anonymous) {
                $actionDesc = "🚨 Posted ANONYMOUS evidence on Project #" . $json->project_id;
            }

            $db->table('system_logs')->insert([
                'actor_email' => $json->user_email,
                'actor_name'  => $realName, 
                'actor_role'  => $role,
                'action_type' => 'COMMENT',
                'description' => $actionDesc,
                'created_at'  => date('Y-m-d H:i:s')
            ]);
        }
        if ($db->table('users')->insert($data)) {
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => ',
                    'description' => "Registered a new {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
            return $this->failServerError('Failed to save user.');
        return $this->respondCreated(['message' => 'Comment posted & Logged']);
    }
    public function react($commentId = null) {
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);
        $json = $this->request->getJSON(); 
        
        $email = $json->user_email ?? null;
        if (!$email) return $this->failUnauthorized('Must provide email');

        $db = \Config\Database::connect();
        
        $existing = $db->table('comment_reactions')
                       ->where('comment_id', $commentId)
                       ->where('user_email', $email)
                       ->get()->getRowArray();

        if ($existing) {
            if ($existing['reaction_type'] === $json->type) {
                return $this->respond(['message' => 'Already reacted']);
            } else {
                // Switch reaction
                $db->query("UPDATE comments SET {$existing['reaction_type']} = GREATEST({$existing['reaction_type']} - 1, 0) WHERE id = ?", [$commentId]);
                $db->query("UPDATE comments SET {$json->type} = {$json->type} + 1 WHERE id = ?", [$commentId]);
                $db->table('comment_reactions')->where('id', $existing['id'])->update(['reaction_type' => $json->type]);
                return $this->respond(['message' => 'Reaction switched']);
            }
        }

        // New reaction
        $db->query("UPDATE comments SET {$json->type} = {$json->type} + 1 WHERE id = ?", [$commentId]);
        $db->table('comment_reactions')->insert([
            'comment_id' => $commentId,
            'user_email' => $email,
            'reaction_type' => $json->type
        ]);
        return $this->respond(['message' => 'Reacted']);
    }
}