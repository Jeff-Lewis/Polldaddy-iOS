//
//  NumOfflineListCell.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/31/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import "NumOfflineListCell.h"
#include "Constants.h"

@implementation NumOfflineListCell

@synthesize offlineResponses, surveyName;

-(id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier {
	
	if ((self = [super initWithStyle:UITableViewCellStyleDefault reuseIdentifier:reuseIdentifier])) {
		// Initialization code
		surveyName = [[UILabel alloc] init];
        surveyName.backgroundColor = [UIColor clearColor];
		offlineResponses = [[UILabel alloc] init];
        offlineResponses.backgroundColor = [UIColor clearColor];
        
        self.backgroundColor = [UIColor clearColor];

		if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
			[offlineResponses setFont:[UIFont systemFontOfSize:16]];
			[surveyName setFont:[UIFont fontWithName:@"American Typewriter" size:36]];
            [surveyName setBounds:CGRectMake(-20, 0, 2*(self.frame.size.width/3), self.frame.size.height)];
			[offlineResponses setBounds:CGRectMake(0, 0, self.frame.size.width/3, self.frame.size.height)];
		}
		else {
			[offlineResponses setFont:[UIFont systemFontOfSize:12]];
			[surveyName setFont:[UIFont fontWithName:@"American Typewriter" size:16]];
			[surveyName setBounds:CGRectMake( 0, 0, 2 * ( self.frame.size.width / 3 ), self.frame.size.height)];
			[offlineResponses setBounds:CGRectMake( 0, 0, self.frame.size.width / 3, self.frame.size.height)];
		}
		
		[surveyName setTextAlignment:NSTextAlignmentLeft];
		[surveyName setTextColor:UIColorFromRGB(0x0182a8)];
		[surveyName setHighlightedTextColor:[UIColor whiteColor]];
		[surveyName setLineBreakMode:NSLineBreakByWordWrapping];
		
		[offlineResponses setTextAlignment:NSTextAlignmentLeft];
		[offlineResponses setTextColor:UIColorFromRGB(0x999999)];
		
		[self.contentView addSubview:surveyName];
		[self.contentView addSubview:offlineResponses];
	}
	
	return self;	
}

- (void)layoutSubviews {
	[super layoutSubviews];
	
	UIView *parent = [self superview];
	
	if ( parent ) {
		if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
			surveyName.frame       = CGRectMake( 20, 0,  parent.bounds.size.width, 70 );
			offlineResponses.frame = CGRectMake( 20, 50, parent.bounds.size.width, 30 );
		}
		else {
			surveyName.frame       = CGRectMake( 10, 0,  parent.bounds.size.width, 23 );
			offlineResponses.frame = CGRectMake( 10, 23, parent.bounds.size.width, 15 );
		}		
	}
}




@end
