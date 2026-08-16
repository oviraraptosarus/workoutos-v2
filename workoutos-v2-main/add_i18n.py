import json  
import sys  
import os  
def add(en_dict, te_dict):  
    try: en = json.load(open('src/i18n/en.json', encoding='utf-8'))  
    except: en = {}  
    try: te = json.load(open('src/i18n/te.json', encoding='utf-8'))  
    except: te = {}  
    en.update(en_dict); te.update(te_dict)  
    json.dump(en, open('src/i18n/en.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False)  
    json.dump(te, open('src/i18n/te.json', 'w', encoding='utf-8'), indent=2, ensure_ascii=False) 
