//
//  PDURLConnection.h
//  Polldaddy
//
//  Created by John Godley on 26/07/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>

@class PDURLConnection;

@protocol PDURLConnectionStatus <NSObject>
@optional
- (void)bytesWritten:(NSInteger)totalSent andTotal:(NSInteger)totalExpected withConnection:(PDURLConnection *)connection;
- (void)bytesRead:(NSInteger)totalRead withRequest:(PDURLConnection *)connection;
- (void)finished:(PDURLConnection *)connection;
- (void)started;
@end

@interface PDURLConnection : NSURLConnection {
    NSHTTPURLResponse *response;
    NSMutableData     *responseData;
    NSURLRequest      *request;
    
    bool inError;
    
    unsigned int tag;
    unsigned int itemID;
    
    id <PDURLConnectionStatus> delegate;
    id otherDelegate;
}

@property(nonatomic,strong) NSHTTPURLResponse *response;
@property(nonatomic,strong) NSMutableData     *responseData;
@property(nonatomic,strong) NSURLRequest      *request;

@property(nonatomic,strong) id<PDURLConnectionStatus> delegate;
@property(nonatomic,strong) id otherDelegate;
@property(nonatomic) unsigned int tag, itemID;
@property(nonatomic) bool inError;

- (id)initWithRequest:(NSURLRequest *)request delegate:(id <PDURLConnectionStatus>)delegate;

@end
