---
title: 免费自建邮件以及QQ通知邮件内容带预览
published: 2026-07-22
description: "免费自建邮件服务器, 有新邮件时能够通过QQ,钉钉,飞书等等通知, 附带邮件内容"
image: ""
tags: []
category: ""
draft: true
lang: ""
uid: 6b26515b-3437-4958-82a2-18216c2873b5
---

平时使用 邮件频率不高, 导致一些重要的不重要的邮件收到了之后,往往过很久心血来潮想起来登录邮箱去看一眼,才发现有新邮件, 今天教大家自己搭建一个邮件服务器, 拥有无限邮箱账号, 并且能够使用 一些通知服务,在收到邮件第一时间通知你,
什么?你的重要邮件在其他邮件服务商? 没关系,只需要让你的原来的邮件转发到你自己的域名邮箱,一样可以即时提醒

准备:
1个域名 自己的域名或者免费的域名都可以,需要能够托管到 Cloudflare
1个Cloudflare账号
1个Github账号

自建邮箱流程:
前往GitHub fork仓库
前往cloud flare 新建worker, 从GitHub导入,
前往cloud flare 配置电子邮件路由规则 catchall 为worker处理
配置worker密钥
往域名邮箱发一封邮件,应该能收到

Webhook/onebot/飞书/钉钉/推送加/server酱/企业微信群机器人/Telegram/...

nonebot:
配置napcat或者其他适配器,增加一条http服务器
在worker配置onebot地址和密钥,接收信息

飞书
钉钉
推送加
server酱
企业微信群机器人
Telegram
