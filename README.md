## Introduction
This is a brief description of the dataset as well as the web page of this `Sanguo` project. The project originated from my personal fascination with the **Records of the Three Kingdoms**, sparked by a seemingly straightforward question that turned out to be a Gordian knot: ***How many individuals are recorded in the **Records of the Three Kingdoms**?***. The project included two parts: the dataset and a web page of visualization. 

## The Dataset

### Data Structure
The dataset is a collection of all individuals logged in the **Records of the Three Kingdoms**. I did the data collection and the process is still ongoing. Each entry (individual) has 19 attributes now: 
1. NameCN. Chineses name of the individual.
2. ID. Assigned ID of the individual, integer.
3. LastName. Last name of the individual (in Chinese).	
4. Zi. Courtesy name of the individual (in Chinese,  null if not known).	
5. NameEN. English name of the individual.
6. DynastyCN. The main dynasty that the individual was living in (in Chinese).	
7. DynastyEN. The main dynasty that the individual was living in (in English).		
8. BirthYear. The birth year of the individual ( null if not known).		
9. DeathYear. The death year of the individual ( null if not known).		
10. LifeSpan. The life span of the individual ( null if not known).		
11. Father. Father of the individual ( null if not known).		
12. FatherID. Father's ID of the individual ( null if not known).		
13. NativePlace. The native place of individual ( null if not known). It's a bit repetitive with `Jun` and `Xian`. May be deleted in future. Note that the individual may not born in their native place. This is the result of ancient Chinese policy.
14. Gender. The gender of the individual.	
15. FirstSeen. The earliest year of the individual that can be identified ( null if not known, Not applicable if Birth_year is known). 
16. LastSeen. The lastest year of the individual that can be identified ( null if not known, Not applicable if Death_year is known). 	
17. Jun. The prefecture of the individual's native place ( null if not known).
18. Xian. The county of the individual's native place ( null if not known).
19. Note. Notes from me. Basically a short bio of the individual with the info from the book and online resources (mainly Wikipedia)

### Additional notes for some attributes
1. **FirstSeen** and **LastSeen**.  This two information come from a combination of date documented in the book and logic deduction. Following described the deduction rules I used: 
   1. Identified from the book text, which includes a few categories. 
      1. The earliet or latest year was recorded directly. e.g., "In the first month of the spring of the first year of Jianheng, *Sun Hao* installed his son, *Sun Jin*, as the Crown Prince" (`"建衡元年春正月，立子瑾为太子", 见《孙皓传》`). Based on this information, we can identify *Sun Jin* was active in the first year of Jianheng, which is 269 CE. And if there is no other known earlier point, 269 CE is the **FirstSeen** info for *Sun Jin*。
      2. The earliest or latest year was recored indirectly. e.g., "In the third month of the first year of Ganlu, *Sun Hao* ... sent Guangludaifu *Ji Zhi* and Wuguanzhonglangjiang *Hong Qiu* on an envoy to *Wei*" (`"甘露元年三月，皓...遣光禄大夫纪陟，五官中郎将弘璆宣明至怀", 见《孙皓传》`), while Pei Songzhi noted that *Ji Zhi* and *Hong Qiu* met a millitary officer -*Wang Bu*- in ShouChun city on this mission (`"干宝晋纪曰： 陟，璆奉使入魏，入境而问讳，入国而问俗。寿春将王布示之马射... ", 见《孙皓传》裴松之注`). Hence we can infer that *Wang Bu* was active in the first year of Ganlu, which is 265 CE.
   2. Inferred from family and social information, based on logic deduction, including:
      1. Deduce information from the individual's relatives birthyear/deathyear. A very common method for **FirstSeen** inferrence is from text like: "(the individual) inherit the title after his father's death" (`"父死袭爵"`). If the father's death year is known, we are then sure the individual was active on his father's death year. A siminlar method for inferring **LastSeen** is: if the birthyear of an individual's child is known, we can say the last seen year of this individual wouldn't be earlier than his child's birthyear (the error range is less than 10 months).  ---- There are records of an individual ater his father was dead AND his father's dead year is known.


### Criteria of Data collection
The `One rule above all` of the dataset is: *The individual must be recorded in the **Records of the Three Kingdoms** or in the notes from Pei Songzhi*. This is determined by my [burning question](##Introduction). It is certain that some individuals are absent from this dataset as they are not documented in this book.

Secondly, I didn't log people mentioned in the book but were living a long time ago, e.g., `尧`， `舜`， `禹`， `孔子`. A general criterion for inclusion is that individuals with a lifespan extending from 146 CE (The first year of `汉桓帝`, whose reign was recognized as the turning point of Han dynasty) or later are logged in the dataset.

Furthermore, I excluded people who have general or vague description that make it impossible to be identified, such as `民 (citizens)`, `贼 (thieves)`, `奴 (slaves)` without a name mentioned.

## The Web Page
{https://weiwei-uvic.github.io/sanguo/}

## Additional Notes
Some warnings and clarifications.
1. There is a serious disparity in this dataset, notably the underrepresentation of female individuals. This discrepancy is a consequence of the bias against women in ancient Chinese society, leading to the recording of only a minimal fraction of female individuals.