package com.willie.cloud.vod.controller.video.qcloud;

import com.alibaba.fastjson.JSONObject;
import com.willie.cloud.vod.domain.config.CloudVodConfig;
import com.willie.cloud.vod.domain.video.Video;
import com.willie.cloud.vod.service.video.VideoService;
import com.willie.cloud.vod.service.vod.CloudVodQueryService;
import com.willie.cloud.vod.service.vod.CloudVodUpdateService;
import com.willie.cloud.vod.util.file.FileUploadUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.commons.CommonsMultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;

/**
 * <p>功能 描述:腾讯云客户端控制器</p>
 * <p>创  建 人:Willie</p>
 * <p>创建 时间:2018/3/27 11:36</p>
 */
@Controller
@RequestMapping("video")
public class QCloudVideoController {
    private static Logger logger = LoggerFactory.getLogger(QCloudVideoController
            .class);
    private final VideoService videoService;
    private final CloudVodQueryService cloudVodQueryService;
    private final CloudVodUpdateService cloudVodUpdateService;

    /**
     * 视频列表
     *
     * @param model 返回数据
     * @return 视频列表
     */
    @RequestMapping(value = "/videos", method = RequestMethod.GET)
    public String list(@RequestParam(value = "page", defaultValue = "0") int page, @RequestParam(value = "pageSize", defaultValue = "4") int pageSize, Model model) {
        CloudVodConfig enableConfig = cloudVodQueryService.getEnableCloudVodManager();
        Pageable pageable = new PageRequest(page, pageSize, Sort.Direction.DESC, "uploadDate");
        Page<Video> videsPage = videoService.getVideoRepository().search(enableConfig, pageable);
        model.addAttribute("videos", videsPage.getContent());
        return "/video/tencent/videos";
    }

    /**
     * 跳转到上传页面
     *
     * @return 上传页面
     */
    @RequestMapping(value = "/upload/videos", method = RequestMethod.GET)
    public String toUpload() {
        return "/video/tencent/upload/uploadVideo";
    }

    /**
     * 上传视频
     *
     * @param request
     * @param file    视频文件
     * @param model   返回页面数据
     * @return 上传成功跳转到视频列表
     */
    @RequestMapping(value = "/videos", method = RequestMethod.POST)
    @ResponseBody
    public Object uploadVideo(HttpServletRequest request, @RequestParam("file") CommonsMultipartFile file, Model model) {
        JSONObject info = new JSONObject();
        try {
            if (!file.isEmpty()) {
                String name = file.getOriginalFilename();
                logger.info("文件名：name{}", name);
                String serverPath = File.separator + "static" + File.separator + "video" + File.separator;//文件在服务端路径
                String realPath = FileUploadUtil.transferFile2Server(name, serverPath, request, file);//上传文件

                info.put("code", 1);
                /*JSONObject info = (JSONObject) cloudVodUpdateService.uploadFile2Server(realPath,null);
                if (0 != info.getIntValue("code")) {
                    model.addAttribute("message", info.getString("message"));
                    return "/error/error";
                }*/
            }
        } catch (Exception e) {
            e.printStackTrace();
//            return "/error/error";
        }
//        return "redirect:/video/videos";
        return info;
    }

    @Autowired
    public QCloudVideoController(VideoService videoService, CloudVodQueryService cloudVodQueryService, CloudVodUpdateService cloudVodUpdateService) {
        this.videoService = videoService;
        this.cloudVodQueryService = cloudVodQueryService;
        this.cloudVodUpdateService = cloudVodUpdateService;
    }
}
