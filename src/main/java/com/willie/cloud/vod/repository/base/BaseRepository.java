package com.willie.cloud.vod.repository.base;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
@NoRepositoryBean
public interface BaseRepository<E, PK extends Serializable> extends JpaRepository<E, PK> {
    /**
     * 使用jpql构造分页
     *
     * @param jpql     查询语句
     * @param pageable 分页
     * @param <E>      实体
     * @return 分页page
     */
    <E> Page<E> createBasePage(String jpql, Pageable pageable);

    /**
     * 使用原生sql构造分页
     *
     * @param sql      查询语句
     * @param pageable 分页
     * @param <E>      实体
     * @return 分页page
     */
    <E> Page<E> createNativeBasePage(String sql, Pageable pageable);

    /**
     * jpql列表查询
     *
     * @param jpql 查询语句
     * @return 列表
     */
    <E> List<E> createBaseList(String jpql);

    /**
     * 列表查询
     *
     * @param sql sql语句
     * @param <E>
     * @return 列表
     */
    <E> List<E> createNativeBaseList(String sql);

    /**
     * 使用jpql返回map查询
     *
     * @param jpql jpal语句
     * @return map
     */
    Map<String, Object> createBaseMap(String jpql);

    /**
     * 使用sql语句查询，返回map
     *
     * @param sql sql语句
     * @return map
     */
    Map<String, Object> createNativeBaseMap(String sql);

    /**
     * 使用jpql语句查询实体
     *
     * @param jpql jpql语句
     * @return 实体
     */
    Optional<E> createBaseEntity(String jpql);

    /**
     * 使用jpql语句查询实体
     *
     * @param sql sql语句
     * @return 实体
     */
    Optional<E> createNativeBaseEntity(String sql);
}
