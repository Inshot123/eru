<?php
declare(strict_types=1);
require __DIR__.'/config.php';
date_default_timezone_set('Asia/Manila');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','httponly'=>true,'samesite'=>'Strict','secure'=>!empty($_SERVER['HTTPS'])]);
function out($d,int $c=200){http_response_code($c);echo json_encode($d);exit;}
function db():PDO{static $p=null;if(!$p){try{$p=new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);$p->exec("SET time_zone='+08:00'");}catch(Throwable $e){out(['error'=>'Database connection failed. Is MySQL running and database.sql imported?'],500);}}return $p;}
function input():array{if(($_SERVER['HTTP_X_REQUESTED_WITH']??'')!=='ERU')out(['error'=>'Bad request'],400);$j=json_decode(file_get_contents('php://input')?:'[]',true);return is_array($j)?$j:[];}
function admin_only():void{session_start();if(empty($_SESSION['admin'])||($_SESSION['exp']??0)<time())out(['error'=>'Session expired. Please log in.'],401);$_SESSION['exp']=time()+1800;}
