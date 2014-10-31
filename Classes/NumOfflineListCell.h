//
//  NumOfflineListCell.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/31/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface NumOfflineListCell : UITableViewCell {
	UILabel *surveyName;
	UILabel *offlineResponses;
}

@property (nonatomic, strong) UILabel *surveyName;
@property (nonatomic, strong) UILabel *offlineResponses;
@end
