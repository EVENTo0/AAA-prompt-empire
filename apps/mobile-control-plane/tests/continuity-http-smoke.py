"""Real Next production HTTP auth smoke; no provider credentials or writes."""
from pathlib import Path
import json,os,secrets,subprocess,tempfile,time,urllib.request,urllib.error
APP=Path(__file__).resolve().parents[1]
def main():
    origin='http://127.0.0.1:4319'; key=secrets.token_urlsafe(40)
    env=dict(os.environ)
    env.update(CONTROL_PLANE_ACCESS_KEY=key,CONTROL_PLANE_SESSION_SECRET=secrets.token_urlsafe(40),CONTROL_PLANE_ENABLE_WRITES='false',EVENTO_CONTINUITY_DRAFTS_ENABLED='false',EVENTO_CONTINUITY_TASK_REPOSITORY='',GITHUB_TOKEN='',VERCEL_TOKEN='',SUPABASE_ACCESS_TOKEN='',NODE_ENV='production')
    rows=[]
    def call(path,method='GET',body=None,cookie=None,request_origin=origin):
        headers={'origin':request_origin,'x-empire-action':'1','Content-Type':'application/json'}
        if cookie:headers['Cookie']=cookie
        req=urllib.request.Request(origin+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
        try:r=urllib.request.urlopen(req,timeout=10)
        except urllib.error.HTTPError as ex:r=ex
        return r.status,r.headers,r.read().decode()
    def check(name,status,expected):
        assert status==expected,f'{name}: unexpected HTTP status';rows.append({'check':name,'status':'PASS','http_status':status})
    with tempfile.TemporaryFile(mode='w+') as log:
        process=subprocess.Popen(['node',str(APP/'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','4319'],cwd=APP,env=env,stdout=log,stderr=log)
        try:
            ready=False
            for _ in range(50):
                if process.poll() is not None:raise RuntimeError('isolated Next server stopped')
                try:call('/login');ready=True;break
                except (OSError,urllib.error.URLError):time.sleep(.1)
            if not ready:raise RuntimeError('isolated Next server was not ready')
            path='/api/evento/continuity/drafts'
            check('anonymous draft GET denied',call(path)[0],401)
            check('anonymous draft POST denied',call(path,'POST',{})[0],401)
            check('invalid login denied',call('/api/session/login','POST',{'key':'wrong'})[0],401)
            status,headers,text=call('/api/session/login','POST',{'key':key});check('isolated operator login',status,200)
            cookie_header=headers.get('Set-Cookie','');assert 'HttpOnly' in cookie_header and 'SameSite=strict' in cookie_header
            cookie=cookie_header.split(';')[0]
            status,_,text=call(path,cookie=cookie);check('authenticated draft configuration',status,200)
            configuration=json.loads(text);assert configuration['enabled'] is False and configuration['execution']=='handoff-only' and key not in text
            check('authenticated write remains disabled',call(path,'POST',{},cookie)[0],403)
            check('cross-origin authenticated write denied',call(path,'POST',{},cookie,'https://attacker.example')[0],403)
            check('tampered operator session denied',call(path,cookie=cookie+'tampered')[0],401)
        finally:
            process.terminate()
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait(timeout=10)
    print(json.dumps({'status':'PASS','scope':'Actual isolated Next production HTTP; provider writes disabled; not hosted/device acceptance','checks':rows},indent=2))
if __name__=='__main__':main()
