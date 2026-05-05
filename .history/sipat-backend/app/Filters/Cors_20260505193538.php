<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class Cors implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
{
    if (ENVIRONMENT === 'development') {
        header('Access-Control-Allow-Origin: http://localhost:5173'); // Better than *
    } else {
        header('Access-Control-Allow-Origin: *');
    }
    
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');

    // Handle Preflight
    if ($request->getMethod() === 'options') {
        header('HTTP/1.1 200 OK');
        exit(); 
    }
}

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Do nothing
    }
}