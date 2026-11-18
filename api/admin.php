<?php
declare(strict_types=1);
require __DIR__.'/db.php';
if($_SERVER['REQUEST_METHOD']!=='POST')out(['error'=>'POST only'],405);
const REQ=['fire'=>['fire','medical'],'crime'=>['police'],'medical'=>['medical'],'traffic'=>['police','medical'],'disaster'=>['drrmo','medical','fire']];
$in=input();$a=$in['a']??'';$d=db();
if($a==='login'){
 session_start();$ip=$_SERVER['REMOTE_ADDR']??'';
 $s=$d->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip=? AND attempted_at>NOW()-INTERVAL 60 SECOND');$s->execute([$ip]);
 if((int)$s->fetchColumn()>=5)out(['error'=>'Too many attempts. Try again in a minute.'],429);
 $s=$d->prepare('SELECT password_hash FROM admins WHERE username=?');$s->execute([(string)($in['u']??'')]);$h=$s->fetchColumn();
 if($h&&password_verify((string)($in['p']??''),$h)){session_regenerate_id(true);$_SESSION['admin']=true;$_SESSION['exp']=time()+1800;out(['ok'=>true]);}
 $d->prepare('INSERT INTO login_attempts(ip) VALUES(?)')->execute([$ip]);usleep(400000);out(['error'=>'Invalid username or password.'],401);
}
if($a==='me'){session_start();out(['ok'=>!empty($_SESSION['admin'])&&($_SESSION['exp']??0)>time()]);}
if($a==='logout'){session_start();session_destroy();out(['ok'=>true]);}
admin_only();
if($a==='data'){
 $st=[];
 foreach($d->query('SELECT id,city,name,lat,lng FROM stations ORDER BY id') as $r)$st[$r['id']]=['id'=>$r['id'],'city'=>$r['city'],'name'=>$r['name'],'lat'=>(float)$r['lat'],'lng'=>(float)$r['lng'],'units'=>[]];
 foreach($d->query('SELECT id,station_id,type,name,status FROM units ORDER BY id') as $u)$st[$u['station_id']]['units'][]=['id'=>$u['id'],'type'=>$u['type'],'name'=>$u['name'],'status'=>$u['status']];
 $inc=[];
 foreach($d->query('SELECT id,ref,name,phone,type,description,address,lat,lng,accuracy,city,status,UNIX_TIMESTAMP(created_at)*1000 AS ts FROM incidents ORDER BY created_at') as $r)
  $inc[$r['id']]=['id'=>(string)$r['id'],'ref'=>$r['ref'],'name'=>$r['name'],'phone'=>$r['phone'],'type'=>$r['type'],'desc'=>$r['description'],'addr'=>$r['address'],'lat'=>(float)$r['lat'],'lng'=>(float)$r['lng'],'city'=>$r['city'],'status'=>$r['status'],'ts'=>(int)$r['ts'],'assigned'=>[]];
 foreach($d->query('SELECT a.incident_id,u.id uid,s.id sid,s.city,u.name FROM assignments a JOIN units u ON u.id=a.unit_id JOIN stations s ON s.id=u.station_id') as $r)
  if(isset($inc[$r['incident_id']]))$inc[$r['incident_id']]['assigned'][]=['unitId'=>$r['uid'],'stId'=>$r['sid'],'label'=>$r['city'].': '.$r['name']];
 out(['inc'=>array_values($inc),'st'=>array_values($st)]);
}
if($a==='assign'||$a==='resolve'){
 $id=(int)($in['incident']??0);$d->beginTransaction();
 $s=$d->prepare('SELECT type,status FROM incidents WHERE id=? FOR UPDATE');$s->execute([$id]);$i=$s->fetch();
 if(!$i){$d->rollBack();out(['error'=>'Incident not found'],404);}
 if($a==='assign'){
  if($i['status']==='resolved'){$d->rollBack();out(['error'=>'Incident already resolved'],409);}
  $uid=(string)($in['unit']??'');$s=$d->prepare('SELECT type,status FROM units WHERE id=? FOR UPDATE');$s->execute([$uid]);$u=$s->fetch();
  if(!$u||$u['status']!=='available'||!in_array($u['type'],REQ[$i['type']],true)){$d->rollBack();out(['error'=>'Unit is not available or not suitable for this incident.'],422);}
  $d->prepare("UPDATE units SET status='dispatched' WHERE id=?")->execute([$uid]);
  $d->prepare('INSERT INTO assignments(incident_id,unit_id) VALUES(?,?)')->execute([$id,$uid]);
  $d->prepare("UPDATE incidents SET status='assigned' WHERE id=?")->execute([$id]);
 }else{
  if($i['status']!=='assigned'){$d->rollBack();out(['error'=>'Only assigned incidents can be resolved.'],409);}
  $d->prepare("UPDATE units u JOIN assignments a ON a.unit_id=u.id SET u.status='available' WHERE a.incident_id=?")->execute([$id]);
  $d->prepare("UPDATE incidents SET status='resolved' WHERE id=?")->execute([$id]);
 }
 $d->commit();out(['ok'=>true]);
}
out(['error'=>'Unknown action'],400);
