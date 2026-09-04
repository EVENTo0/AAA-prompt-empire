#pragma once

#include "CoreMinimal.h"
#include "AttributeSet.h"
#include "AbilitySystemComponent.h"
#include "OctopusAttributeSet.generated.h"

#define OCTOPUS_ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
    GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
    GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
    GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
    GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)

UCLASS()
class OCTOPUS_API UOctopusAttributeSet : public UAttributeSet
{
    GENERATED_BODY()

public:
    UOctopusAttributeSet();

    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData Health;
    OCTOPUS_ATTRIBUTE_ACCESSORS(UOctopusAttributeSet, Health)

    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData MaxHealth;
    OCTOPUS_ATTRIBUTE_ACCESSORS(UOctopusAttributeSet, MaxHealth)

    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData CombatResource;
    OCTOPUS_ATTRIBUTE_ACCESSORS(UOctopusAttributeSet, CombatResource)

    UPROPERTY(BlueprintReadOnly, Category = "Attributes")
    FGameplayAttributeData MaxCombatResource;
    OCTOPUS_ATTRIBUTE_ACCESSORS(UOctopusAttributeSet, MaxCombatResource)

    virtual void PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data) override;
};
