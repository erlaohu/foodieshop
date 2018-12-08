<?php
/**
 * Foodie_in_Japan
 * =========================================================
 * Copy right 2018-2025 Foodie_in_Japan 保留所有权利。
 * =========================================================
 * @author : wangxiaohu
 * @date : 2018.5.1
 * @version : v1.0.0.0
 */
namespace data\model;

use data\model\BaseModel as BaseModel;

/**
 * 产品库存表
 * @author Administrator
 *
 */
class NsGoodsStockModel extends BaseModel {

    protected $table = 'ns_goods_stock';
    /**
     * (non-PHPdoc)
     * @see \data\model\BaseModel::save()
     */
    public function save($data = [], $where = [], $sequence = null){
        $retval = parent::save($data, $where, $sequence);
        if($retval)
        {
            // $this->addLog($data, $where, $sequence);
        }
        return $retval;
    }
    /**
     * 添加日志(针对父类save方法)
     * @param unknown $data
     * @param unknown $where
     * @param unknown $sequence
     */
    public function addLog($data, $where, $sequence){
        $user_log = new UserLogModel();
        if(empty($where))
        {
            $user_log->addUserLog(1, "添加商品:".json_encode($data));
        }else{
            $user_log->addUserLog(1, "修改商品:".json_encode($data));
        }
    }
  
    

}