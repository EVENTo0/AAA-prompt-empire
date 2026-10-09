#include "OctopusCharacter.h"

#include "AbilitySystemComponent.h"
#include "Camera/CameraComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "InputAction.h"
#include "InputMappingContext.h"
#include "OctopusAttributeSet.h"

AOctopusCharacter::AOctopusCharacter()
{
    PrimaryActorTick.bCanEverTick = false;

    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = false;
    bUseControllerRotationRoll = false;

    GetCharacterMovement()->bOrientRotationToMovement = true;
    GetCharacterMovement()->RotationRate = FRotator(0.0f, 720.0f, 0.0f);

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 1200.0f;
    CameraBoom->SetRelativeRotation(FRotator(-60.0f, -45.0f, 0.0f));
    CameraBoom->bUsePawnControlRotation = false;
    CameraBoom->bDoCollisionTest = false;

    IsometricCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("IsometricCamera"));
    IsometricCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    IsometricCamera->bUsePawnControlRotation = false;

    AbilitySystemComponent = CreateDefaultSubobject<UAbilitySystemComponent>(TEXT("AbilitySystemComponent"));
    AbilitySystemComponent->SetIsReplicated(false);

    AttributeSet = CreateDefaultSubobject<UOctopusAttributeSet>(TEXT("AttributeSet"));
}

UAbilitySystemComponent* AOctopusCharacter::GetAbilitySystemComponent() const
{
    return AbilitySystemComponent;
}

void AOctopusCharacter::BeginPlay()
{
    Super::BeginPlay();

    AbilitySystemComponent->InitAbilityActorInfo(this, this);

    if (APlayerController* PlayerController = Cast<APlayerController>(GetController()))
    {
        if (ULocalPlayer* LocalPlayer = PlayerController->GetLocalPlayer())
        {
            if (UEnhancedInputLocalPlayerSubsystem* InputSubsystem =
                    LocalPlayer->GetSubsystem<UEnhancedInputLocalPlayerSubsystem>())
            {
                if (DefaultMappingContext)
                {
                    InputSubsystem->AddMappingContext(DefaultMappingContext, 0);
                }
            }
        }
    }
}

void AOctopusCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    if (UEnhancedInputComponent* EnhancedInput = Cast<UEnhancedInputComponent>(PlayerInputComponent))
    {
        if (MoveAction)
        {
            EnhancedInput->BindAction(MoveAction, ETriggerEvent::Triggered, this, &AOctopusCharacter::Move);
        }
    }
}

void AOctopusCharacter::Move(const FInputActionValue& Value)
{
    const FVector2D Input = Value.Get<FVector2D>();
    if (Input.IsNearlyZero() || !IsometricCamera)
    {
        return;
    }

    FVector CameraForward = IsometricCamera->GetForwardVector();
    CameraForward.Z = 0.0f;
    CameraForward.Normalize();

    FVector CameraRight = IsometricCamera->GetRightVector();
    CameraRight.Z = 0.0f;
    CameraRight.Normalize();

    AddMovementInput(CameraForward, Input.Y);
    AddMovementInput(CameraRight, Input.X);
}
