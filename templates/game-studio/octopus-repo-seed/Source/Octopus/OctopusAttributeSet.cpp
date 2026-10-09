#include "OctopusAttributeSet.h"
#include "GameplayEffectExtension.h"

UOctopusAttributeSet::UOctopusAttributeSet()
{
    InitMaxHealth(100.0f);
    InitHealth(100.0f);
    InitMaxCombatResource(100.0f);
    InitCombatResource(100.0f);
}

void UOctopusAttributeSet::PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data)
{
    Super::PostGameplayEffectExecute(Data);

    if (Data.EvaluatedData.Attribute == GetHealthAttribute())
    {
        SetHealth(FMath::Clamp(GetHealth(), 0.0f, GetMaxHealth()));
    }
    else if (Data.EvaluatedData.Attribute == GetMaxHealthAttribute())
    {
        SetMaxHealth(FMath::Max(GetMaxHealth(), 1.0f));
        SetHealth(FMath::Clamp(GetHealth(), 0.0f, GetMaxHealth()));
    }
    else if (Data.EvaluatedData.Attribute == GetCombatResourceAttribute())
    {
        SetCombatResource(FMath::Clamp(GetCombatResource(), 0.0f, GetMaxCombatResource()));
    }
    else if (Data.EvaluatedData.Attribute == GetMaxCombatResourceAttribute())
    {
        SetMaxCombatResource(FMath::Max(GetMaxCombatResource(), 0.0f));
        SetCombatResource(FMath::Clamp(GetCombatResource(), 0.0f, GetMaxCombatResource()));
    }
}
