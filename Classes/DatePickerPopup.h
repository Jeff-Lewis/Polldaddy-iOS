//
//  DatePickerPopup.h
//  Polldaddy
//
//  Created by John Godley on 20/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>


@class DatePickerController;

@protocol DatePickerControllerDelegate
- (void) datePickerController:(DatePickerController *)controller didPickDate:(NSDate *)date andType:(unsigned long)type;
@end

@interface DatePickerController : UIViewController {
  NSObject <DatePickerControllerDelegate> *__unsafe_unretained delegate;

  UIDatePicker *datePicker;
	UIView       *background;
	UIToolbar    *toolBar;
	
	unsigned long dateType;
}

- (IBAction)done:(id)sender;
- (IBAction)cancel:(id)sender;
- (id)initWithType:(unsigned long)type;

@property (nonatomic, strong) UIDatePicker *datePicker;
@property (nonatomic, unsafe_unretained) NSObject <DatePickerControllerDelegate> *delegate;

@end
