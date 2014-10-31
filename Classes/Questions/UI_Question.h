//
//  UI_Question.h
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <UIKit/UIKit.h>

@class Question, QuestionsViewController, Language;

@interface UI_Question : UIViewController <UIWebViewDelegate> {
	CGPoint lastPoint, originPoint;
	QuestionsViewController *controller;
    Language *pack;
}

@property (nonatomic,strong) Language *pack;

- init;

// The golden function!
- (NSString *) collectData;

// General question display
-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory;
-(void) updateDetails:(UIWebView *)view;
-(void) displayNextButton:(UIButton *)surveyButton andCancelButton:(UIButton *)cancelButton;
-(void) displayQuestion;
-(void) setController:(QuestionsViewController *)controller;

// Helper functions
- (CGPoint) autoHeightLabel:(UILabel *)field withText:(NSString *)text atPoint:(CGPoint)last;
- (CGFloat) getMaxWidth;
- (CGFloat) getMaxHeight;
- (CGFloat) getMaxFrameWidth;
- (CGFloat) getMaxFrameHeight;
- (CGFloat) getWidthInOrientation:(unsigned int)orientation;

// Returns YES if the question has been answered, NO otherwise
- (boolean_t) isCompleted;
- (boolean_t) isValid;

- (NSDictionary *)getFormValues:(UIWebView *)web restrictTo:(NSString *)restricter;

// Return an error string indicating why isCompleted returned NO, empty string if no completion error
- (NSString *) getError;
- (NSString *) getValidError;
@end
