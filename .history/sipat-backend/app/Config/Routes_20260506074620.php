<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', ['namespace' => 'App\Controllers'], function($routes) {
    // Catch the browser's CORS preflight security check
    $routes->options('users', 'UserController::create'); 
    
    // Catch the actual React POST request (Sign Up)
    $routes->post('users', 'UserController::create'); 

    // NEW: Catch GET requests (To view all users)
    $routes->get('users', 'UserController::index'); 
$routes->options('projects', 'ProjectController::create');
    $routes->post('projects', 'ProjectController::create');
    $routes->get('projects', 'ProjectController::index'); // 🚀 Fetch Projects
    
    $routes->options('projects/(:num)', 'ProjectController::update/$1'); 
    $routes->put('projects/(:num)', 'ProjectController::update/$1');
    $routes->options('projects/(:num)', 'ProjectController::show/$1');
$routes->get('projects/(:num)', 'ProjectController::show/$1'); // Fetch Single Project

$routes->options('comments', 'CommentController::create');
$routes->post('comments', 'CommentController::create'); // Post Comment
$routes->get('comments/(:num)', 'CommentController::index/$1'); // Get Comments for Project
$routes->put('comments/(:num)/react', 'CommentController::react/$1'); // Handle Likes

// Catch the OPTIONS preflight request for a single project


// Fetch a single project by ID
});