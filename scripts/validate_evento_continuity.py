"""Validate dated continuity records without treating source reports as runtime proof."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROTECTED = {'COMPANY_CORE', 'INTERNAL_CONTROL_PLANE', 'SHARED_CAPABILITY', 'SHARED_DATA'}

def validate(snapshot):
    if snapshot['version'] != '1.0' or snapshot['revision'] < 1:
        raise ValueError('unsupported continuity contract')
    policy = snapshot['policy']
    if policy['external_execution_enabled'] or policy['production_release_enabled'] or policy['self_approval']:
        raise ValueError('continuity cannot grant execution, release, or self-approval')
    if len(policy['active']) > policy['max_active'] or len(policy['supporting']) > policy['max_supporting']:
        raise ValueError('portfolio work limit exceeded')
    projects = snapshot['projects']
    ids = [p['id'] for p in projects]
    if len(ids) != len(set(ids)):
        raise ValueError('duplicate project id')
    repository_projects = [p for p in projects if p['repository']]
    if len(repository_projects) != snapshot['coverage']['owned_repositories']:
        raise ValueError('repository coverage differs from inventory')
    if len(projects) != snapshot['coverage']['registered_projects_and_ideas']:
        raise ValueError('project coverage differs from inventory')
    for p in projects:
        if not p['next_action'].strip() or not p['open_gates']:
            raise ValueError('missing next action or evidence gap: ' + p['id'])
        if p['repository'] and not re.fullmatch(r'[0-9a-f]{40}', p['source_ref'] or ''):
            raise ValueError('unbound repository source')
        for e in p['evidence']:
            if e['kind'] == 'workflow' and e['ref'] != p['source_ref']:
                raise ValueError('workflow is not bound to the observed source')
        if p['role'] in PROTECTED and (p['sellable'] or p['catalog_published']):
            raise ValueError('protected capability cannot be extracted')
        if p['sellable'] or p['catalog_published']:
            raise ValueError('this source-observation snapshot cannot promote a product')
        if p['score'] is not None and (not p['score_ref'] or p['score_origin'] != 'SOURCE_REPORTED'):
            raise ValueError('source score attribution is missing')
    for item in snapshot['sources']:
        if not re.fullmatch(r'[0-9a-f]{64}', item['sha256']) or item['bytes'] < 1:
            raise ValueError('source pack integrity missing')
    serialized = json.dumps(snapshot)
    if re.search(r'(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sb_secret_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY)', serialized):
        raise ValueError('credential material detected')
    return {'repositories':len(repository_projects), 'projects':len(projects), 'source_packs':len(snapshot['sources']), 'promotions':0}

def main():
    canonical = json.loads((ROOT/'registry/evento-continuity.v1.json').read_text())
    mirror = json.loads((ROOT/'apps/mobile-control-plane/data/evento-continuity.v1.json').read_text())
    if mirror != canonical: raise ValueError('dashboard mirror differs from canonical continuity record')
    print(json.dumps({'status':'PASS', **validate(canonical)}))

if __name__ == '__main__': main()
