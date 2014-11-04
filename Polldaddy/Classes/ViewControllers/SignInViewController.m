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

@implementation SignInViewController

@synthesize backgroundImage,signInForm,logoImage,username,password,signInButton,loggedIn,activtyIndicator,api;

-(id)init{
	self = [super init];
	
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
		self = [self initWithNibName:@"SignInViewController" bundle:nil];
	else 
		self = [self initWithNibName:@"SignInViewController-iPhone" bundle:nil];
	
	[self setLoggedIn:0];

	return self;
}

- (void)viewWillAppear:(BOOL)animated {
	[super viewWillAppear:animated];
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
	[self setLoggedIn:1];
	NSLog(@"Login Success!");
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	
	NSLog(@"rotating signin");
	
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
        if ( UIDeviceOrientationIsPortrait( [[UIApplication sharedApplication] statusBarOrientation] ) ) {
			// portrait view
			[[self view] setFrame:CGRectMake(0, 0, 768, 1004)];
			
			logoImage.frame = CGRectMake(9, 122, logoImage.frame.size.width, logoImage.frame.size.height);
			signInForm.frame = CGRectMake(89, 253, signInForm.frame.size.width, signInForm.frame.size.height);
			backgroundImage.frame = CGRectMake(0, 0, 1024, 1004);
		}
		else {
			// landscape view
			[[self view] setFrame:CGRectMake(0, 0, 1024, 748)];
			
			logoImage.frame = CGRectMake(9, 150, logoImage.frame.size.width, logoImage.frame.size.height);
			signInForm.frame = CGRectMake(425, 10, signInForm.frame.size.width, signInForm.frame.size.height);
			backgroundImage.frame = CGRectMake(0, 0, 1024, 1024);
		}
	}
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)selectField{
	[super viewDidLoad];
}

-(BOOL)shouldAutorotate {
    return UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}


- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
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

- (void)viewDidLoad {
    [super viewDidLoad];
    
	// Hook up data entry
	[username addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];     
	[password addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];     

    [activtyIndicator stopAnimating];
}

@end
