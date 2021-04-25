### Freshteam chrome plugin

The plugin is used to automaticly download Freshteam's candidates resumes attachments. 

![Alt text](docs/example.gif?raw=true "freshteam plugin demo")


## How to install? 

1. Download the plugin. [freshteam-plugin-v0.0.1.zip](https://gitlab.com/darumatic/chrome-freshteam-plugin/-/raw/master/release/freshteam-plugin-v0.0.1.zip?inline=false)

2. Unzip the plugin file. 
3. Open Chrome, and open the following URL. `chrome://extensions/`
![Alt text](docs/chrome-extension.png?raw=true "load unpacked")

4. Click [Load unpacked] button, then select the plugin unzipped folder
5. Freshteam plugin Daruamtic HR 0.0.1 will be installed. 


## How to use it? 

### Download all jobs' attachments

1. Manually login to Freshteam. 
2. Navigate to the jobs page, The URL pattern is "/hire/jobs". 
![Alt text](docs/download-all.png?raw=true "job detail")

> Note: Make sure the URL is /hire/jobs, or the plugin will display no scripts. If the URL contains page parameter
> the plugin will download the current page and after. 

3. Click Freshteam chrome plugin extension icon. 
4. Select [Download All Attachments] from the dropdown menu. 
5. The plugin will open a new page, and start to iterate all job attachments and download them. 


### Download single job's attachments

1. Manually login to Freshteam. 
2. Navigate to the job candidates page. The URL pattern is "/hire/jobs/xxx/candidates/listview"
![Alt text](docs/job-detail.png?raw=true "job detail")

> Note: Make sure the URL is ending with /candidates/listview, or the plugin will display no scripts. 

3. Click Freshteam chrome plugin extension icon. 
4. Select [Download attachments] from the dropdown menu. 
![Alt text](docs/download.png?raw=true "download")

5. The plugin will open a new page, and start to iterate all candidates attachments and download them. 
