using UnrealBuildTool;
using System.Collections.Generic;

public class OctopusTarget : TargetRules
{
    public OctopusTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("Octopus");
    }
}
