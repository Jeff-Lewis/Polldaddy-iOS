//
//  RadioCell.h
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface RadioCell : UITableViewCell {
	UIImageView *radioButton;
	UILabel     *answer;
}

@property (nonatomic,strong) UIImageView *radioButton;
@property (nonatomic,strong) UILabel *answer;

@end
