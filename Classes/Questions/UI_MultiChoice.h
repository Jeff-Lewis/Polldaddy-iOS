//
//  UI_MultiChoice.h
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_MultiChoice, Language;

@interface UI_MultiChoice : UI_Question <UITextFieldDelegate>{
	ST_MultiChoice *question;
	
	UITableView         *choiceTable;
	UIScrollView        *scroller;
	UILabel             *otherLabel;
	UITextField         *otherField;
	UILabel             *commentLabel;
	UITextField         *commentField;
	NSMutableDictionary *choices;
	NSMutableArray      *chosen;
    
    UIWebView           *web;
    UIToolbar           *toolbar;
    
    CGSize keyboardSize;
    CGRect original;
}

@property (nonatomic, strong) ST_MultiChoice *question;

- initWithQuestion:(ST_MultiChoice *)theQuestion andPack:(Language *)pack;

- (IBAction)readOther:(id)sender;

- (NSString *) collectData;
- (boolean_t) isCompleted;
- (boolean_t) isChosen:(NSNumber *)key;
- (NSString *) getError;
- (void) displayQuestion;
- (BOOL)hasOther;

@end
