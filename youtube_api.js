/*----------------------------------------------------------------------- Objects definition -----------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function VideoObj(id, title, thumb , desc , thumb_md , pubdate) {
    this.id = id;
    this.title = title;
    this.thumb = thumb;
    this.desc = desc;
    this.thumb_md = thumb_md;
    this.stats = new Array(); //index : 0 viewcount, 1 likes , 2 dislikes , 3 commentcount
    this.channelid = 0;
    this.channeltitle = "";
    this.pubdate = new Date(pubdate);
}
VideoObj.prototype.str_views = function() { return this.stats[0].value.toLocaleString('en-US', {minimumFractionDigits: 0}) };
VideoObj.prototype.str_likes = function() { return this.stats[1].value.toLocaleString('en-US', {minimumFractionDigits: 0}) };
VideoObj.prototype.str_dislikes = function() { return this.stats[2].value.toLocaleString('en-US', {minimumFractionDigits: 0}) };
VideoObj.prototype.str_comments = function() { return this.stats[3].value.toLocaleString('en-US', {minimumFractionDigits: 0}) };
VideoObj.prototype.str_html_table = function() { 
    return "<tr>"
    + "<td><a href=\"https://www.youtube.com/watch?v=" + this.id  + "\"><img src=\"" + this.thumb + "\" /img></a></td><td>" + this.pubdate.toLocaleString() + "</td><td>" 
    + this.title + "</td><td>" + this.str_views() + "</td><td>"
    + this.str_likes() + "</td><td>" + this.str_dislikes() + "</td><td>" + this.str_comments() + "</td></tr>"
};
VideoObj.prototype.str_html_side_video = function() { 
    return ""
};

function ChannelObj(name , desc , thumb , pub_date ) {
    this.id = 0;
    this.name = name;
    this.desc = desc;
    this.thumb = thumb;
    this.pubdate = new Date(pub_date);
    this.stats = new Array();  /*"viewCount": "43008105", "subscriberCount": "103668", "videoCount": "123"*/
    this.videos = new Array();
}
ChannelObj.prototype.str_pubdate = function () { return this.pubdate.toDateString() };
ChannelObj.prototype.str_views = function() { return this.stats[0].value.toLocaleString('en-US', {minimumFractionDigits: 0})};
ChannelObj.prototype.str_subscribers = function() { return this.stats[1].value.toLocaleString('en-US', {minimumFractionDigits: 0})};
ChannelObj.prototype.str_videos = function() { return this.stats[2].value.toLocaleString('en-US', {minimumFractionDigits: 0})};

function PlayListObj(id, title , desc , pubdate , thumbnail ) {
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.pubdate = new Date(pubdate);
    this.thumb = thumbnail;
}
/*------------------------------------------------------------------------------------------------------------------------------------------------------------------*/


/*----------------------------------------------------------------------- functions definitions --------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

//Function to get channel based information, the callback will have the returned channelObj as a parameter
function get_channelInfo(APIKey , channel_id , callBackFunction ){
    $.getJSON( "https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=" + channel_id + "&key=" + APIKey , function(data) {
        /*On success callback*/
        var channel = new ChannelObj( data.items[0].snippet.title ,  data.items[0].snippet.description , data.items[0].snippet.thumbnails.default.url , new Date(data.items[0].snippet.publishedAt) );
        channel.id = channel_id;
        channel.stats.push( { key: "views", value: Number(data.items[0].statistics.viewCount) });
        channel.stats.push( { key: "subscribers", value: Number(data.items[0].statistics.subscriberCount) });
        channel.stats.push( { key: "videoCount", value: Number(data.items[0].statistics.videoCount) });
        callBackFunction(channel);
    });
}
/*Function to search for channels, maxresult = max 50, orderBy valid values = viewCount, videoCount, rating, date, the callback will contain a channelContainer as parameter */
function search_channels(APIKey , Keywords , MaxResults, OrderBy , callBackFunction ){
    $.getJSON( "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + MaxResults + "&order=" + OrderBy + "&q=" + Keywords + "&type=channel&fields=etag%2Citems%2Ckind%2CnextPageToken%2CpageInfo%2CregionCode&key=" + APIKey , function(data) {
        /*On success callback*/
        var channelContainer = [];
        var channel;
        for(var i = 0 ; i < MaxResults ; i++)
        {
            channel = new ChannelObj(data.items[i].snippet.title,data.items[i].snippet.description,data.items[i].snippet.thumbnails.default.url,data.items[i].snippet.publishedAt);
            channel.id = data.items[i].snippet.channelId;
            channelContainer.push(channel);
        }
        callBackFunction(channelContainer);
    });
}
/*Function to get a channel's playlists max= 50 results, the callBackFunction will contain a playlistContainer as parameter */
function get_playlists(APIKey , channelid , maxResults , callBackFunction ) {
    $.getJSON( "https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=" + channelid + "&maxResults=" + maxResults + "&fields=etag%2Citems%2Ckind%2CnextPageToken%2CpageInfo&key=" + APIKey ,
        //callback
        function(data) {
            var playlistContainer = [];
            data.items.forEach( function (element){
                playlistContainer.push(new PlayListObj(element.id , element.snippet.title, element.snippet.description , element.snippet.publishedAt , element.snippet.thumbnails.default.url));
            }, this);

            callBackFunction(playlistContainer);
    });
}

//Function that gets the videos for a channelid, callBackFunction will contain a videoObjArray as parameter
function get_VideosForChannel(APIKey, channel_id, results , callBackFunction , orderBy = "viewCount" ) {
    videoContainer = [];
    var count=0;
    var queriesCount = 0;
    
    if(results > 50)
        queriesCount = 50;
    else
        queriesCount = results;

    /* order : rating , viewCount , videoCount , title*/
    var baseUri = "https://www.googleapis.com/youtube/v3/search?part=snippet,id&fields=etag%2Citems%2Ckind%2CnextPageToken%2CpageInfo&order=" + orderBy + "&type=video&key=" + APIKey + "&channelId=" + channel_id + "&maxResults=" + queriesCount;
    $.getJSON( baseUri ,
        function( data ) {
            for (i = 0; i < data.items.length; i++) {
                videoContainer.push(
                    new VideoObj(
                            data.items[i].id.videoId,
                            data.items[i].snippet.title,
                            data.items[i].snippet.thumbnails.default.url ,
                            data.items[i].snippet.description,
                            data.items[i].snippet.thumbnails.medium.url,
                            data.items[i].snippet.publishedAt
                    ));
                count++;
                if(count == results)
                {
                    get_Video_Stats(APIKey, videoContainer , 0 , callBackFunction );
                    return;
                }
            }
            get_ChannelVideos( videoContainer , data.nextPageToken , baseUri , function() { get_Video_Stats(APIKey , videoContainer, 0 , callBackFunction ); }) ;
        }
    );
}
    //Recursive subfunction to retrieve all videos from channel in successive calls, is part of get_VideosForChannel
    function get_ChannelVideos( videosContainer  , nextPageToken , baseUrl , callBack) {
        if(typeof nextPageToken != "undefined")
        {
            $.getJSON( baseUrl + "&pageToken=" + nextPageToken ,
                function( data ) {
                    for (i = 0; i < data.items.length; i++) {
                        videosContainer.push(
                            new VideoObj(
                                data.items[i].id.videoId,
                                data.items[i].snippet.title,
                                data.items[i].snippet.thumbnails.default.url,
                                data.items[i].snippet.description,
                                data.items[i].snippet.thumbnails.medium.url,
                                data.items[i].snippet.publishedAt
                        ));
                    }
                    get_ChannelVideos(videosContainer , data.nextPageToken , baseUrl , callBack );
                }
            );
        }else
        {
            /* Recursion done all videos are retrieved */
            callBack();
        }
    }

/*Function to retrieve video statistics ex: views , likes , dislikes, callBack will contain VideosArray as parameter*/
function get_Video_Stats(APIKey, VideosArray , indexCount, callBack )  {

    if(indexCount < VideosArray.length)
    {
        var loops = 0;

        if((VideosArray.length - indexCount) > 50 )
            loops = 50;
        else
            loops = (VideosArray.length - indexCount);
        
        var queryStr = "";
        for(var i = 0 ; i < loops ; i++)
            queryStr += VideosArray[(indexCount + i)].id + ",";

        queryStr = queryStr.slice(0, -1);

        $.getJSON( "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=" + queryStr + "&key=" + APIKey ,
            function( data ) {
                for(var x = 0 ; x < data.items.length ; x++, indexCount++ )
                {
                    VideosArray[indexCount].stats.push( { key: 'views', value: Number(data.items[x].statistics.viewCount) });
                    VideosArray[indexCount].stats.push( { key: 'likes', value: Number(data.items[x].statistics.likeCount) });
                    VideosArray[indexCount].stats.push( { key: 'dislikes', value: Number(data.items[x].statistics.dislikeCount) });
                    VideosArray[indexCount].stats.push( { key: 'comments', value: Number(data.items[x].statistics.commentCount) });
                }
                get_Video_Stats(APIKey , VideosArray , indexCount , callBack );
        });
    } else
    {
        callBack(VideosArray);
    }
}

//This function retrieves the stats for a given video id, an empty video object is returned with only the stats for the given id
function get_Video_Stats_SingleVideo(APIKey, videoId , callBackFunction )  {
    $.getJSON( "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=" + videoId + "&key=" + APIKey ,
        function( data ) {
            var video = new VideoObj();
            video.id = videoId;
            video.stats.push( { key: 'views', value: Number(data.items[0].statistics.viewCount) });
            video.stats.push( { key: 'likes', value: Number(data.items[0].statistics.likeCount) });
            video.stats.push( { key: 'dislikes', value: Number(data.items[0].statistics.dislikeCount) });
            video.stats.push( { key: 'comments', value: Number(data.items[0].statistics.commentCount) });
        callBackFunction(video);
    });
}

//This function syncs the stats for a given videoObj
function sync_Stats_SingleVideo(APIKey, videoObject , callBackFunction )  {
    $.getJSON( "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=" + videoObject.id + "&key=" + APIKey ,
        function( data ) {
            videoObject.stats.push( { key: 'views', value: Number(data.items[0].statistics.viewCount) });
            videoObject.stats.push( { key: 'likes', value: Number(data.items[0].statistics.likeCount) });
            videoObject.stats.push( { key: 'dislikes', value: Number(data.items[0].statistics.dislikeCount) });
            videoObject.stats.push( { key: 'comments', value: Number(data.items[0].statistics.commentCount) });
        callBackFunction();
    });
}

/*Function to search for videos, maxresult = max 50, orderBy valid values = viewCount, rating, date, title, callBackFunction will contain an Array of videoObj */
function search_videos(APIKey , Keywords , MaxResults , OrderBy , callBackFunction ){
    
    if( MaxResults > 50 )
        MaxResults = 50;

    Keywords = "&q=" + Keywords;
    
    var myurl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + MaxResults + "&order=" + OrderBy + Keywords + "&type=video&fields=etag%2Citems%2Ckind%2CnextPageToken%2CpageInfo%2CregionCode&key=" + APIKey;
    $.getJSON( myurl , function(data) {
        /*On success callback*/
        var videosContainer = [];
        var video;

        data.items.forEach(function(element) {
            video = new VideoObj(element.id.videoId, element.snippet.title,element.snippet.thumbnails.default.url,element.snippet.description, element.snippet.thumbnails.medium.url,element.snippet.publishedAt);
            video.channelid = element.snippet.channelId;
            video.channeltitle = element.snippet.channeltitle;
            videosContainer.push(video);
        }, this);

        get_Video_Stats(APIKey , videosContainer , 0 , callBackFunction);
    });
}

/*------------------------------------------------------------------- HTML output functions  --------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function display_Video_Side_List( ElementsArray , statIndex , statName ) {
    var text = "";
    ElementsArray.forEach(function(element) {
        text +=   "<div class=\"video_small_info\" id=\"" + element.id + "\" >";
        text +=   "<img src=\"" + element.thumb + "\" />";
        text +=   "<div class=\"video_small_meta\">";
            text +=   "<a href=\"https://youtube.com/watch?v=" + element.id + "\">" + element.title + "</a>";
            text +=   "<h4>" + element.stats[statIndex].value.toLocaleString('en-US', {minimumFractionDigits: 0}) + " " + statName + "</h4>"
        text +=   "</div></div>";
    }, this);
    return text;
}

function display_Video_Stats(video) {
    var html = "";
    html += video.stats[0].value + " views " + " | " + video.stats[1].value + " likes " + " | " + video.stats[2].value + " dislikes";
    return html;
}
/*------------------------------------------------------------- VideoObj Comparer definition --------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
function compareViews(a,b) {
   return Number(b.stats[0].value) - Number(a.stats[0].value);
}
function compareLikes(a,b) {
   return Number(b.stats[1].value) - Number(a.stats[1].value);
}
function compareDislikes(a,b) {
   return Number(b.stats[2].value) - Number(a.stats[2].value);
}