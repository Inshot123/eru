<?php
declare(strict_types=1);
require __DIR__.'/db.php';
if($_SERVER['REQUEST_METHOD']!=='POST')out(['error'=>'POST only'],405);
$in=input();$a=$in['a']??'';$d=db();
const TYPES=['fire','crime','medical','traffic','disaster'];
if($a==='submit'){
 $name=mb_substr(trim(strip_tags((string)($in['name']??''))),0,60);
 $phone=(string)($in['phone']??'');$type=(string)($in['type']??'');
 $lat=filter_var($in['lat']??null,FILTER_VALIDATE_FLOAT);$lng=filter_var($in['lng']??null,FILTER_VALIDATE_FLOAT);
 if(mb_strlen($name)<2)out(['error'=>'Please enter the reporter name.'],422);
 if(!preg_match('/^\d{11}$/',$phone))out(['error'=>'Mobile number must be exactly 11 digits.'],422);
 if(!in_array($type,TYPES,true))out(['error'=>'Invalid incident type.'],422);
 if($lat===false||$lng===false||abs($lat)>90||abs($lng)>180)out(['error'=>'Invalid location.'],422);
 $ip=$_SERVER['REMOTE_ADDR']??'';
 $s=$d->prepare('SELECT COUNT(*) FROM incidents WHERE ip=? AND created_at>NOW()-INTERVAL 10 MINUTE');$s->execute([$ip]);
 if((int)$s->fetchColumn()>=5)out(['error'=>'Too many reports from this device. Please call 911 if urgent.'],429);
 $best=null;$bd=1e9;
 foreach($d->query('SELECT city,lat,lng FROM stations') as $st){$r=M_PI/180;$h=sin(($st['lat']-$lat)*$r/2)**2+cos($lat*$r)*cos($st['lat']*$r)*sin(($st['lng']-$lng)*$r/2)**2;$k=12742*asin(sqrt($h));if($k<$bd){$bd=$k;$best=$st['city'];}}
 $ref='ERU-'.strtoupper(bin2hex(random_bytes(3)));
 $acc=isset($in['acc'])&&is_numeric($in['acc'])?(float)$in['acc']:null;
 $d->prepare('INSERT INTO incidents(ref,name,phone,type,description,address,lat,lng,accuracy,city,ip) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
   ->execute([$ref,$name,$phone,$type,mb_substr(trim(strip_tags((string)($in['desc']??''))),0,300),mb_substr(trim(strip_tags((string)($in['addr']??''))),0,120),$lat,$lng,$acc,$best??'Unknown',$ip]);
 out(['ok'=>true,'ref'=>$ref,'city'=>$best]);
}
if($a==='track'){
 $refs=array_values(array_filter(array_slice((array)($in['refs']??[]),0,20),fn($r)=>is_string($r)&&preg_match('/^ERU-[A-F0-9]{6}$/',$r)));
 if(!$refs)out(['items'=>[]]);
 $s=$d->prepare('SELECT ref,type,status,UNIX_TIMESTAMP(created_at)*1000 AS ts FROM incidents WHERE ref IN ('.implode(',',array_fill(0,count($refs),'?')).') ORDER BY created_at DESC');$s->execute($refs);
 out(['items'=>array_map(fn($r)=>['ref'=>$r['ref'],'type'=>$r['type'],'status'=>$r['status'],'ts'=>(int)$r['ts']],$s->fetchAll())]);
}
if($a==='stations')out(['items'=>array_map(fn($r)=>['name'=>$r['name'],'city'=>$r['city'],'lat'=>(float)$r['lat'],'lng'=>(float)$r['lng']],$d->query('SELECT name,city,lat,lng FROM stations')->fetchAll())]);
out(['error'=>'Unknown action'],400);
