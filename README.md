# Polldaddy for iOS #

This is the Polldaddy code moved from SVN in its last known good state.

## Configuration ##

The configuration of the Polldaddy API is set in the Configuration.plist file in the Resources directory.  This file is intentionally excluded from the repository in the .gitignore so that API keys are not added to the repo.  There is a Configuration-example.plist file in the project that shows the format for the Configuration.plist file.  Please create a Configuration.plist file with the appropriate API key and Url. 

## Third Party Libraries ##

Third party source code is included in the "Third Party" directory.  Version 1.4 of the TBXML source is included.  There have been significant API changes in TBXML between versions 1.4 and 1.5.  The TBXML library is used for interfacing with elements returned by the Polldaddy API.  The API now supports JSON, so rather than update support for XML, it would be ideal to update the API code to use JSON and eliminate the need for TBXML all together.

Warnings from some of the third party source files have been turned off by adding the "-w" compiler flag in the "Build Phases" area.

In the future, CocoaPods should be considered for external libraries to be included.