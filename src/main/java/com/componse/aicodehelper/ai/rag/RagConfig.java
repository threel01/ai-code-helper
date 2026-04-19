package com.componse.aicodehelper.ai.rag;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.splitter.DocumentByParagraphSplitter;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class RagConfig {
    @Resource
    private EmbeddingModel embeddingModel;
    @Resource
    private EmbeddingStore<TextSegment> embeddingStore;

    //内容检索器
    @Bean
    public ContentRetriever contentRetriever() {
        //1.加载文档
        List<Document> documents = FileSystemDocumentLoader.loadDocuments("src/main/resources/docs");
        //2.文档分割，最大1000字符，重叠200
        DocumentByParagraphSplitter documentByParagraphSplitter = new DocumentByParagraphSplitter(1000, 200);
        //3.文档加载,将文档分割为段落TextSegment,将段落添加文件名转换为元数据,存储到向量数据库中
        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(documentByParagraphSplitter)
                .textSegmentTransformer(segment -> TextSegment.from(
                        segment.metadata().getString("file_name") + "\n" + segment.text(),
                        segment.metadata()
                ))
                .embeddingModel(embeddingModel)//向量模型
                .embeddingStore(embeddingStore)//向量存储数据库
                .build();
        //4.加载文档
        ingestor.ingest(documents);
        //5.自定义内容检索器
        EmbeddingStoreContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(4)//最多返回4条结果
                .minScore(0.70)//最小相似度
                .build();
        return contentRetriever;

    }



}
