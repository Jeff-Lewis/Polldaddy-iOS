//
//  PDURLConnection.m
//  Polldaddy
//
//  Created by John Godley on 26/07/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "PDURLConnection.h"

@implementation PDURLConnection

@synthesize response, responseData, delegate, inError, tag, request, otherDelegate, itemID;

- (id)initWithRequest:(NSURLRequest *)req delegate:(id <PDURLConnectionStatus>)del {
    // Initialize the ivars before initializing with the request
    // because the connection is asynchronous and may start
    // calling the delegates before we even return from this
    // function.
    
    self.response      = nil;
    self.responseData  = nil;
    self.inError       = NO;
    self.request       = req;
    
    [self setDelegate:del];
    
    self = [super initWithRequest:req delegate:self startImmediately:NO];
    return self;
}

- (PDURLConnection *)init {
    self = [super init];
    
    self.response     = nil;
    self.responseData = nil;
    self.delegate     = nil;
    self.inError      = NO;
    self.request      = nil;
    
    return self;
}


/////////////////////////////////////////////////////////////////
////// NSURLConnectionDelegate


- (void)connection:(NSURLConnection*)connection didReceiveData:(NSData *)data {
    PDURLConnection *pdconnection = (PDURLConnection *)connection;
    
    [pdconnection.responseData appendData:data];

    if ( [[pdconnection delegate] respondsToSelector:@selector(bytesRead:withRequest:)] )
        [delegate bytesRead:pdconnection.responseData.length withRequest:pdconnection];
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    PDURLConnection *pdconnection = (PDURLConnection *)connection;

    if ( [[pdconnection delegate] respondsToSelector:@selector(finished:)] )
        [delegate finished:pdconnection];
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSHTTPURLResponse *)resp {
    PDURLConnection *pdconnection = (PDURLConnection *)connection;
    
    pdconnection.response     = resp;
    pdconnection.responseData = [NSMutableData dataWithCapacity:1024];

    if ( [[pdconnection delegate] respondsToSelector:@selector(started)] )
        [[pdconnection delegate] started];
}

- (void)connection:(NSURLConnection *)connection didSendBodyData:(NSInteger)bytesWritten totalBytesWritten:(NSInteger)totalBytesWritten totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite {
    PDURLConnection *pdconnection = (PDURLConnection *)connection;
    
    if ( [[pdconnection delegate] respondsToSelector:@selector(bytesWritten:andTotal:withConnection:)] )
        [[pdconnection delegate] bytesWritten:totalBytesWritten andTotal:totalBytesExpectedToWrite withConnection:pdconnection]; 
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    PDURLConnection *pdconnection = (PDURLConnection *)connection;

    pdconnection.inError = YES;
    [pdconnection.responseData setLength:0];
}

- (NSCachedURLResponse *)connection:(NSURLConnection *)connection willCacheResponse:(NSCachedURLResponse *)cachedResponse {
	return nil;
}

@end

