//
//  UI_DateTime.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"
#import "DatePickerPopup.h"

@class ST_DateTime, Language;

@interface UI_DateTime : UI_Question<UIPickerViewDelegate, DatePickerControllerDelegate> {
	ST_DateTime      	   *question;
	UILabel			         *label;
	DatePickerController *datePicker;
	UIButton             *pickDate;
	UIButton             *pickTime;
	NSDate               *selectedTime;
	NSDate               *selectedDate;
	boolean_t             displayingPicker;
}

- initWithQuestion:(ST_DateTime *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (IBAction)pickDate:(id)sender;
- (IBAction)changeDateInLabel:(id)sender;
- (void) datePickerController:(DatePickerController *)controller didPickDate:(NSDate *)date andType:(unsigned int)type;
- (void) displayQuestion;

@end
