using UnrealBuildTool;
using System.Collections.Generic;

public class OctopusEditorTarget : TargetRules
{
    public OctopusEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("Octopus");
    }
}
