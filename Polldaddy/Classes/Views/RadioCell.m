    //
//  RadioCell.m
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "RadioCell.h"
#import "Constants.h"

@implementation RadioCell

@synthesize radioButton, answer;

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Overriden to allow any orientation.
    return YES;
}

-(id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier {
	
	if ((self = [super initWithStyle:UITableViewCellStyleDefault reuseIdentifier:reuseIdentifier])) {
		answer = [[UILabel alloc] init];

		// Initialization code
		radioButton = [[UIImageView alloc] init];
		if ( [Constants isIpad] ) {
			radioButton.image = [UIImage imageNamed:@"NotSelected.png"];
			answer.font       = [UIFont systemFontOfSize:17];
		}
		else {
			answer.font       = [UIFont systemFontOfSize:12];
			radioButton.image = [UIImage imageNamed:@"NotSelected-iPhone.png"];				
		}
		
		answer.textAlignment = NSTextAlignmentLeft;
		answer.textColor     = [UIColor PdTextColor];
		
		[self.contentView addSubview:radioButton];
		[self.contentView addSubview:answer];
	}
	
	return self;	
}

- (void)layoutSubviews {
	[super layoutSubviews];
	
	CGRect  contentRect = self.contentView.bounds;
	CGFloat boundsX = contentRect.origin.x;
	CGRect  frame;
	
	if ( [Constants isIpad] ) {
		frame = CGRectMake(boundsX + 10, [Constants multichoiceTopPadding], 30, 30);
		radioButton.frame = frame;
		
		frame = CGRectMake(boundsX + 50, [Constants multichoiceTopPadding], contentRect.size.width - 50, 30);
	}
	else {
		frame = CGRectMake(boundsX + 10, [Constants multichoiceTopPadding], 18, 18);
		radioButton.frame = frame;
		
		frame = CGRectMake(boundsX + 35, [Constants multichoiceTopPadding], contentRect.size.width - 40, 18);
	}
	
	answer.frame = frame;
}



@end
