using UnrealBuildTool;
using System.Collections.Generic;

public class OctopusEditorTarget : TargetRules
{
    public OctopusEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V6;
        IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_8;
        ExtraModuleNames.Add("Octopus");
    }
}
