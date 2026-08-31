#!/usr/bin/env python3
"""Credential-gated live parity run for Codex CLI and Claude Code."""
from __future__ import annotations
import json, os, shutil, subprocess, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "live-proof"
REQUIRED = ["plan", "tools", "permissions", "sandbox", "skills", "subagents", "evidence", "result"]

def now(): return datetime.now(timezone.utc).isoformat()

def schema():
    return {"type":"object","properties":{k:{"type":"string"} for k in REQUIRED},"required":REQUIRED,"additionalProperties":False}

def claude_auth_mode():
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "api_key"
    if os.environ.get("CLAUDE_CODE_OAUTH_TOKEN"):
        return "oauth_token"
    return None

def clean_env(provider):
    env = {"PATH":os.environ.get("PATH",""),"HOME":os.environ.get("HOME",""),"LANG":os.environ.get("LANG","C.UTF-8"),"TERM":os.environ.get("TERM","xterm")}
    if provider == "codex":
        env["OPENAI_API_KEY"] = os.environ.get("OPENAI_API_KEY","")
    else:
        if os.environ.get("ANTHROPIC_API_KEY"):
            env["ANTHROPIC_API_KEY"] = os.environ["ANTHROPIC_API_KEY"]
        elif os.environ.get("CLAUDE_CODE_OAUTH_TOKEN"):
            env["CLAUDE_CODE_OAUTH_TOKEN"] = os.environ["CLAUDE_CODE_OAUTH_TOKEN"]
    return env

def validate(payload, provider):
    missing=[k for k in REQUIRED if not isinstance(payload.get(k),str) or not payload[k].strip()]
    if missing: raise RuntimeError(f"{provider} missing normalized fields: {missing}")
    return {"provider":provider,"status":"PASS","normalized":payload}

def run_cmd(cmd,cwd,env):
    return subprocess.run(cmd,cwd=cwd,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=300,check=False)

def run_codex(work,prompt,schema_path):
    if shutil.which("codex") is None: raise RuntimeError("codex CLI not installed")
    output=work/"codex-last.json"
    cmd=["codex","exec","--ephemeral","--ignore-user-config","--ignore-rules","--skip-git-repo-check","--sandbox","read-only","--output-schema",str(schema_path),"--output-last-message",str(output),prompt]
    r=run_cmd(cmd,work,clean_env("codex"))
    if r.returncode: raise RuntimeError(f"codex failed rc={r.returncode}: {r.stderr[-1200:]}")
    return validate(json.loads(output.read_text(encoding="utf-8")),"codex")

def run_claude(work,prompt,schema_obj):
    if shutil.which("claude") is None: raise RuntimeError("claude CLI not installed")
    mode=claude_auth_mode()
    if mode is None: raise RuntimeError("Claude credential missing")
    cmd=["claude","-p","--safe-mode","--no-session-persistence","--permission-mode","plan","--allowedTools","Read","--disallowedTools","Edit","Write","Bash","--max-turns","3","--max-budget-usd","1.00","--output-format","json","--json-schema",json.dumps(schema_obj,separators=(",",":")),prompt]
    r=run_cmd(cmd,work,clean_env("claude-code"))
    if r.returncode: raise RuntimeError(f"claude failed rc={r.returncode}: {r.stderr[-1200:]}")
    wrapper=json.loads(r.stdout); payload=wrapper.get("structured_output")
    if not isinstance(payload,dict): raise RuntimeError("claude response missing structured_output")
    out=validate(payload,"claude-code"); out["usage"]=wrapper.get("usage"); out["auth_mode"]=mode; return out

def main():
    if not os.environ.get("OPENAI_API_KEY"):
        print("provider parity requires OPENAI_API_KEY",file=sys.stderr); return 2
    if not claude_auth_mode():
        print("provider parity requires ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN",file=sys.stderr); return 2
    OUT.mkdir(parents=True,exist_ok=True)
    evidence={"schema_version":1,"suite":"provider-harness-parity","checked_at":now(),"status":"FAIL","claude_auth_mode":claude_auth_mode()}
    try:
        with tempfile.TemporaryDirectory(prefix="empire-provider-parity-") as td:
            work=Path(td); (work/"fixture.txt").write_text("EMPIRE_FIXTURE_MARKER=ALPHA-17\nfunction add(a,b){ return a+b; }\n",encoding="utf-8")
            s=schema(); sp=work/"schema.json"; sp.write_text(json.dumps(s),encoding="utf-8")
            prompt=("Read fixture.txt only. Review whether add(a,b) matches its name and include the exact fixture marker in evidence. "
                    "Do not modify files or run shell commands. Return concise JSON fields: plan, tools, permissions, sandbox, skills, subagents, evidence, result.")
            codex=run_codex(work,prompt,sp); claude=run_claude(work,prompt,s)
            comparison={"same_required_fields":sorted(codex["normalized"])==sorted(claude["normalized"]),"both_capture_fixture_marker":"ALPHA-17" in codex["normalized"]["evidence"] and "ALPHA-17" in claude["normalized"]["evidence"],"mutation_expected":False}
            evidence.update({"status":"PASS","fixture_marker":"ALPHA-17","codex":codex,"claude_code":claude,"comparison":comparison})
            if not all(comparison.values()): raise RuntimeError("provider normalized evidence comparison failed")
    except Exception as exc:
        evidence["error"]=f"{type(exc).__name__}: {exc}"; (OUT/"provider-parity-evidence.json").write_text(json.dumps(evidence,indent=2),encoding="utf-8"); print(json.dumps(evidence,indent=2)); return 1
    (OUT/"provider-parity-evidence.json").write_text(json.dumps(evidence,indent=2),encoding="utf-8"); print(json.dumps(evidence,indent=2)); return 0
if __name__ == "__main__": raise SystemExit(main())
