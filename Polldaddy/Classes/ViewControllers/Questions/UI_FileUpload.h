//
//  UI_Url.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <UIKit/UIKit.h>

#import "UI_Question.h"

@class ST_FileUpload, Language;

@interface UI_FileUpload : UI_Question <UINavigationControllerDelegate, UIImagePickerControllerDelegate> {
	ST_FileUpload *question;

	UIImageView *drawImage;
	CGPoint      lastMousePoint;
	
	int  mouseMoved;
	BOOL mouseSwiped;
	BOOL hasData;
	
	NSString *dataFileName;
	NSString *dataFilePath;
	UIView   *blankView;
	
	UIButton *cameraButton, *clearButton;
}

@property (nonatomic, strong) Question *question;

- initWithQuestion:(ST_FileUpload *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isValid;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

- (void)cameraButtonPress:(id)sender;
- (void)clearButtonPress:(id)sender;
@end
