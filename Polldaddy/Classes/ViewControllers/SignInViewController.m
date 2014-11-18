    //
//  SignInViewController.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright 2010 Automattic, Inc All rights reserved.
//

#import "SignInViewController.h"
#import "PolldaddyAppDelegate.h"
#import "PolldaddyAPI.h"

NSString * const kDidSignInNotification = @"DidSignInNotification";

@implementation SignInViewController

@synthesize backgroundImage,signInForm,logoImage,username,password,signInButton,activtyIndicator,api;

-(id)init{
	
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
		self = [super initWithNibName:@"SignInViewController" bundle:nil];
	else 
		self = [super initWithNibName:@"SignInViewController-iPhone" bundle:nil];
	
    if(self != nil) {
        //Initialization
    }

	return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Hook up data entry
    [username addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];
    [password addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];
    
    [activtyIndicator stopAnimating];
}

-(UIStatusBarStyle)preferredStatusBarStyle {
    return UIStatusBarStyleLightContent;
}

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

- (void)viewWillAppear:(BOOL)animated {
	[super viewWillAppear:animated];
}

-(void)viewDidAppear:(BOOL)animated {
    [super viewDidAppear:animated];
}

- (void)startSignin {	
	NSLog(@"Login attempt... %@", [username text] );
	
    // make keyboard disappear
	NSString * email = [username text];
	NSString * pass = [password text];

	BOOL login_success = [PolldaddyAPI accountLogin:email andPassword:pass];
	
	if ( login_success )
		[self loginSuccess];
	else {
		[password resignFirstResponder];
		[username resignFirstResponder];
	}

	[activtyIndicator stopAnimating];    
}

-(IBAction) signInClicked {
    // Start spinner, hide keyboard
	[activtyIndicator startAnimating];
    [password resignFirstResponder];
    [username resignFirstResponder];
    
    // Do login in background
    [self performSelector:@selector(startSignin) withObject:nil afterDelay:0];  
}

- (void) loginSuccess{
	//[self setLoggedIn:1];
    
    //Post a notification about the sign in
    [[NSNotificationCenter defaultCenter] postNotificationName:kDidSignInNotification object:nil];
	
    NSLog(@"Login Success!");
    
    //Dismiss the view controller on success
    [self dismissViewControllerAnimated:YES completion:nil];
}

-(void)viewWillLayoutSubviews
{
    //Laying out sign in
    NSLog(@"viewWillLayoutSubviews in SignInViewController");
    
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
        if ( UIDeviceOrientationIsPortrait( [[UIApplication sharedApplication] statusBarOrientation] ) ) {
            // portrait view
            [[self view] setFrame:CGRectMake(0, 0, 768, 1024)];
            
            logoImage.frame = CGRectMake(9, 142, logoImage.frame.size.width, logoImage.frame.size.height);
            signInForm.frame = CGRectMake(89, 273, signInForm.frame.size.width, signInForm.frame.size.height);
        }
        else {
            // landscape view
            [[self view] setFrame:CGRectMake(0, 0, 1024, 768)];
            
            logoImage.frame = CGRectMake(9, 170, logoImage.frame.size.width, logoImage.frame.size.height);
            signInForm.frame = CGRectMake(425, 30, signInForm.frame.size.width, signInForm.frame.size.height);
        }
    }
    
    [super viewWillLayoutSubviews];
}

-(BOOL)shouldAutorotate {
    return UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (IBAction) signUpForPolldaddy{
		
	[[UIApplication sharedApplication] openURL:[NSURL URLWithString:@"http://polldaddy.com/pricing/"]];

}

- (void)viewWillDisappear:(BOOL)animated{
    [super viewWillDisappear:animated];
    
    if ( animated ) {
        [UIView beginAnimations:nil context:nil];
        [UIView setAnimationDuration:0.25];
        [UIView setAnimationDelegate:self];
        [UIView setAnimationDidStopSelector:@selector(fadingDidStop:finished:context:)];
        
        [UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
        [UIView setAnimationTransition:UIViewAnimationTransitionNone forView:self.view cache:NO];
        [[self view] setAlpha:0.0];
        
        [UIView commitAnimations];
    }
}

- (void)fadingDidStop:(NSString *)animationID finished:(bool)finished context:(void *)context{
}

- (IBAction)readField:(id)sender {
	[sender resignFirstResponder];

	// Remove the popup keyboard
	if ( sender == username )
		[password becomeFirstResponder];
	else
		[self signInClicked];
}

@end
