//
//  SignInViewController.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright 2010 Automattic, Inc All rights reserved.
//

#import <UIKit/UIKit.h>
#import "PDButton.h"
#import <QuartzCore/QuartzCore.h>
#import "PolldaddyAPI.h"


@interface SignInViewController : UIViewController {
	UIImageView					*logoImage;
	UIView						*signInForm;
	UITextField					*username;
	UITextField					*password;
	PDButton					*signInButton;
	int							loggedIn;
	UIActivityIndicatorView		*activtyIndicator;
	PolldaddyAPI				*api;
}

@property (nonatomic, strong) IBOutlet UIImageView *backgroundImage;
@property (nonatomic, strong) IBOutlet UIImageView *logoImage;
@property (nonatomic, strong) IBOutlet UIView *signInForm;
@property (nonatomic, strong) IBOutlet UITextField *username;
@property (nonatomic, strong) IBOutlet UITextField *password;
@property (nonatomic, strong) IBOutlet PDButton *signInButton;
@property (nonatomic, strong) IBOutlet UIActivityIndicatorView *activtyIndicator;
@property (nonatomic, strong) PolldaddyAPI *api;

@property int loggedIn;

- (IBAction) signUpForPolldaddy;
- (IBAction) signInClicked;
- (void) loginSuccess;

@end
