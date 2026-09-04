#pragma once

#include "CoreMinimal.h"
#include "AbilitySystemInterface.h"
#include "GameFramework/Character.h"
#include "InputActionValue.h"
#include "OctopusCharacter.generated.h"

class UAbilitySystemComponent;
class UCameraComponent;
class UInputAction;
class UInputMappingContext;
class UOctopusAttributeSet;
class USpringArmComponent;

UCLASS()
class OCTOPUS_API AOctopusCharacter : public ACharacter, public IAbilitySystemInterface
{
    GENERATED_BODY()

public:
    AOctopusCharacter();

    virtual UAbilitySystemComponent* GetAbilitySystemComponent() const override;

    UFUNCTION(BlueprintPure, Category = "OCTOPUS|Attributes")
    const UOctopusAttributeSet* GetOctopusAttributeSet() const { return AttributeSet; }

protected:
    virtual void BeginPlay() override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

    void Move(const FInputActionValue& Value);

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OCTOPUS|Camera")
    TObjectPtr<USpringArmComponent> CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OCTOPUS|Camera")
    TObjectPtr<UCameraComponent> IsometricCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OCTOPUS|Abilities")
    TObjectPtr<UAbilitySystemComponent> AbilitySystemComponent;

    UPROPERTY()
    TObjectPtr<UOctopusAttributeSet> AttributeSet;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "OCTOPUS|Input")
    TObjectPtr<UInputMappingContext> DefaultMappingContext;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "OCTOPUS|Input")
    TObjectPtr<UInputAction> MoveAction;
};
