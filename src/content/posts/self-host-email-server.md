---
title: 自建能够QQ提醒的邮件服务器
published: 2026-08-03
description: "即时通知邮件消息,再也不用去垃圾箱翻验证码了"
image: ""
tags: [邮件, 通知]
category: "教程"
draft: false
lang: ""
uid: f8042166-f555-412e-91e8-10f2f9913b92
---

## 前言

> 使用邮件接收登录验证码时, 必须先打开邮箱, 刷刷刷, 刷新半天发现, 居然在垃圾箱里  
> 更不用说像国外的网站注册有时有延迟,迟迟收不到验证码, 等好不容易找到验证码, 可能过期了
> 并且邮件的通知远不如 QQ 微信 TG 等即时通讯软件的通知醒目  
> 平时 QQ 来个消息基本能马上收到, 但是邮件由于手机推送系统和后台应用限制, 容易遗漏这些通知  
> 我前不久搭建的 [cloud-mail](https://github.com/maillab/cloud-mail) 项目刚好就是在通知方面不太完善  
> 原项目只支持 TG, 于是我给他增加了 QQ, Webhook 通知方式  
> 这样当邮箱收到新邮件时, 我的 QQ 或者微信就马上收到一条邮件消息, 再也不用去邮箱找了

## 使用效果展示

当邮件收到一封邮件时

![](./images/2026/08/image/self-host-email-server-1785746626118.webp)

收到了通知,带预览内容 (以 QQ 为例)

![](./images/2026/08/image/self-host-email-server-1785746749696.webp)

这样接受登录验证码非常方便,并且所有数据都保存在你自己的域名邮箱里, 非常的安全,不用担心隐私泄露

不过, 大多数人使用自己以前的邮箱 比如 QQ 邮箱,Outlook 之类的,我没有这些邮箱的域名, 能不能也能实现这个通知呢?

当然能, 只不过需要一点点设置, 我们可以前往你自己的邮箱,设置邮件转发到你自己的域名邮箱, 这样当你的邮箱收到邮件时,会转发到你的域名邮箱,然后就会有通知了

QQ 邮箱设置

![qq邮箱](./images/2026/08/image/self-host-email-server-1785746996342.webp)

outlook 设置

![](./images/2026/08/image/self-host-email-server-1785747275131.webp)

## 部署教程准备

1. 准备 [Github](https://github.com) 账号, [Cloudflare](https://dash.cloudflare.com/) 账号
2. 登录 [Github](https://github.com) , fork [这个项目](https://github.com/yinleren6/cloud-mail)

### 部署

项目部署在 cloudflare 上对海外网络延迟低, 邮件接受也很快

[参考原项目部署文档](https://doc.skymail.ink/)
