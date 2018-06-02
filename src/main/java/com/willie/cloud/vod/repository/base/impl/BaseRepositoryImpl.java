package com.willie.cloud.vod.repository.base.impl;

import com.willie.cloud.vod.repository.base.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.util.CollectionUtils;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.persistence.TypedQuery;
import java.util.*;

/************************************************
 * <p>Copyright © by whxxykj</p>
 * <p>All right reserved.</p>
 * <p>Create Author: Willie</p>
 * <p> Create Date  : 2018/4/12</p>
 * <p>Last version : 1.0</p>
 * <p>Description  : </p>
 * <p>Last Update Date:</p>
 * <p>Change Log:</p>
 **************************************************/
public class BaseRepositoryImpl<E, PK> extends SimpleJpaRepository implements
        BaseRepository {
    protected static int DEFAULT_TOTAL = 0;//默认记录总数
    protected final EntityManager entityManager;
    protected final Class<E> domainClass;

    public BaseRepositoryImpl(Class<E> domainClass, EntityManager em) {
        super(domainClass, em);
        this.entityManager = em;
        this.domainClass = domainClass;
    }

    @Override
    public Page createBasePage(String jpql, Pageable pageable) {
        TypedQuery typedQuery = entityManager.createQuery(jpql, domainClass);
        typedQuery.setFirstResult(pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List pageResultList = typedQuery.getResultList();

        int total = DEFAULT_TOTAL;//默认记录总数
        if (CollectionUtils.isEmpty(pageResultList)) {
            pageResultList = Collections.EMPTY_LIST;
        } else {
            TypedQuery countTypedQuery = entityManager.createQuery(jpql, domainClass);
            total = countTypedQuery.getResultList().size();
        }
        return new PageImpl<E>(pageResultList, pageable, total);
    }

    @Override
    public Page createNativeBasePage(String sql, Pageable pageable) {
        Query query = entityManager.createNativeQuery(sql, domainClass);
        query.setFirstResult(pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        List pageResultList = query.getResultList();
        int total = DEFAULT_TOTAL;//默认记录总数
        if (CollectionUtils.isEmpty(pageResultList)) {
            pageResultList = Collections.EMPTY_LIST;
        } else {
            total = createNativePageCount(sql);
        }
        return new PageImpl<E>(pageResultList, pageable, total);
    }

    @Override
    public List createBaseList(String jpql) {
        TypedQuery typedQuery = entityManager.createQuery(jpql, domainClass);
        List resultList = typedQuery.getResultList();
        return CollectionUtils.isEmpty(resultList) ? Collections.EMPTY_LIST : resultList;
    }

    @Override
    public List createNativeBaseList(String sql) {
        Query query = entityManager.createNativeQuery(sql, domainClass);
        List resultList = query.getResultList();
        return CollectionUtils.isEmpty(resultList) ? Collections.EMPTY_LIST : resultList;
    }

    @Override
    public Map<String, Object> createBaseMap(String jpql) {
        TypedQuery typedQuery = entityManager.createQuery(jpql, HashMap.class);
        Map<String, Object> resultMap = (Map<String, Object>) typedQuery.getSingleResult();
        return CollectionUtils.isEmpty(resultMap) ? Collections.EMPTY_MAP : resultMap;
    }

    @Override
    public Map<String, Object> createNativeBaseMap(String sql) {
        Query query = entityManager.createNativeQuery(sql, domainClass);
        Map<String, Object> resultMap = (Map<String, Object>) query.getSingleResult();
        return CollectionUtils.isEmpty(resultMap) ? Collections.EMPTY_MAP : resultMap;
    }

    @Override
    public Optional createBaseEntity(String jpql) {
        TypedQuery typedQuery = entityManager.createQuery(jpql, domainClass);
        Object resultBean = typedQuery.getSingleResult();
        Optional result = Optional.of(resultBean);
        return result;
    }

    @Override
    public Optional createNativeBaseEntity(String sql) {
        Query query = entityManager.createNativeQuery(sql, domainClass);
        Object resultBean = query.getSingleResult();
        Optional result = Optional.of(resultBean);
        return result;
    }

    /**
     * 使用原生sql统计
     *
     * @param sql 查询语句
     * @return
     */
    private int createNativePageCount(String sql) {
        StringBuilder countSql = new StringBuilder(" select count(*) from ");
        countSql.append("(").append(sql).append(") as base");
        Query countQuery = entityManager.createNativeQuery(countSql.toString());
        Object countResult = countQuery.getSingleResult();
        int count = Objects.isNull(countResult) ? 0 : Integer.parseInt(countResult.toString());
        return count;
    }
}
