//
//  MultiSelectCellController.h
//  MultiRowSelect
//
//  Created by Matt Gallagher on 11/01/09.
//  Copyright 2008 Matt Gallagher. All rights reserved.
//
//  Permission is given to use this source code file, free of charge, in any
//  project, commercial or otherwise, entirely at your risk, with the condition
//  that any redistribution (in part or whole) of source code must retain
//  this copyright and permission notice. Attribution in compiled projects is
//  appreciated but not required.
//

#import <UIKit/UIKit.h>
#import "CellController.h"

@class UITableViewCell;

@interface MultiSelectCellController : NSObject <CellController> {
	NSString     *label;
    NSString     *statusText;
    
	unsigned int  surveyId;
	bool          selected;
    bool          loading;
}

@property (nonatomic, strong) NSString *label, *statusText;
@property (nonatomic,readonly) unsigned int surveyId;
@property (nonatomic) bool selected, loading;

- (id)initWithLabel:(NSString *)newLabel andSurveyId:(unsigned int)theSurveyId;
- (void)clearSelectionForTableView:(UITableView *)tableView indexPath:(NSIndexPath *)indexPath;
-(void) setStatus:(NSString *)text forCell:(UITableViewCell *)cell;
- (void)selected:(UITableViewCell *)cell;

@end
