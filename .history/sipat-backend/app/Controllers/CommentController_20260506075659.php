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
        // 🚀 Sort by the highest AI Score first, then most recent
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

        $data = [
            'project_id'     => $json->project_id,
            'target_phase'   => $json->target_phase ?? 'Whole Project',
            'author_name'    => $json->is_anonymous ? 'Anonymous Citizen' : ($json->author_name ?? 'Citizen'),
            'text_content'   => $json->text_content,
            'image_url'      => $json->image_url ?? null,
            'ai_match_score' => $json->ai_match_score ?? 0, // 🚀 NEW
            'is_ghost_alert' => $json->is_ghost_alert ?? false, // 🚀 NEW
            'created_at'     => date('Y-m-d H:i:s')
        ];

        \Config\Database::connect()->table('comments')->insert($data);
        return $this->respondCreated(['message' => 'Comment posted']);
    }
    public function react($commentId = null) {
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);
        $json = $this->request->getJSON(); // { type: 'likes' | 'unlikes' | 'neutrals' }
        
        $db = \Config\Database::connect();
        $db->query("UPDATE comments SET {$json->type} = {$json->type} + 1 WHERE id = ?", [$commentId]);
        return $this->respond(['message' => 'Reacted']);
    }
}