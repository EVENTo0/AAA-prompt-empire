using UnrealBuildTool;

public class Octopus : ModuleRules
{
    public Octopus(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "EnhancedInput",
            "GameplayAbilities",
            "GameplayTags",
            "GameplayTasks"
        });

        PrivateDependencyModuleNames.AddRange(new[]
        {
            "UMG",
            "AIModule",
            "NavigationSystem"
        });
    }
}
